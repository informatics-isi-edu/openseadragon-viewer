/*
 * This code was borrowed from https://github.com/usnistgov/OpenSeadragonFiltering
 * and was modified to properly do the filtering
 */
(function () {
    'use strict';

    var $ = window.OpenSeadragon;
    if (!$) {
        $ = require('openseadragon');
        if (!$) {
            throw new Error('OpenSeadragon is missing.');
        }
    }
    // Requires OpenSeadragon >=2.1
    if (!$.version || $.version.major < 2 ||
        $.version.major === 2 && $.version.minor < 1) {
        throw new Error(
            'Filtering plugin requires OpenSeadragon version >= 2.1');
    }

    $.Viewer.prototype.setFilterOptions = function(options) {
        if (!this.filterPluginInstance) {
            options = options || {};
            options.viewer = this;
            this.filterPluginInstance = new $.FilterPlugin(options);
        } else {
            setOptions(this.filterPluginInstance, options);
        }
    };

    /**
     * @class FilterPlugin
     * @param {Object} options The options
     * @param {OpenSeadragon.Viewer} options.viewer The viewer to attach this
     * plugin to.
     * @param {String} [options.loadMode='async'] Set to sync to have the filters
     * applied synchronously. It will only work if the filters are all synchronous.
     * Note that depending on how complex the filters are, it may also hang the browser.
     * @param {Object[]} options.filters The filters to apply to the images.
     * @param {OpenSeadragon.TiledImage[]} options.filters[x].items The tiled images
     * on which to apply the filter.
     * @param {function|function[]} options.filters[x].processors The processing
     * function(s) to apply to the images. The parameters of this function are
     * the context to modify and a callback to call upon completion.
     */
    $.FilterPlugin = function(options) {
        options = options || {};
        if (!options.viewer) {
            throw new Error('A viewer must be specified.');
        }
        var self = this;
        this.viewer = options.viewer;

        this.viewer.addHandler('tile-loaded', tileLoadedHandler);
        this.viewer.addHandler('tile-drawing', tileDrawingHandler);

        // filterIncrement allows to determine whether a tile contains the
        // latest filters results.
        this.filterIncrement = 0;

        setOptions(this, options);


        function tileLoadedHandler(event) {
            var processors = getFiltersProcessors(self, event.tiledImage);
            if (processors.length === 0) {
                return;
            }
            var tile = event.tile;
            var image = event.image;
            if (image !== null && image !== undefined) {
                var canvas = window.document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);
                tile._renderedContext = context;
                var callback = event.getCompletionCallback();
                applyFilters(context, processors, callback);
                tile._filterIncrement = self.filterIncrement;
            }
        }


        function applyFilters(context, filtersProcessors, callback) {
            if (callback) {
                var currentIncrement = self.filterIncrement;
                var callbacks = [];
                for (var i = 0; i < filtersProcessors.length - 1; i++) {
                    (function(i) {
                        callbacks[i] = function() {
                            // If the increment has changed, stop the computation
                            // chain immediately.
                            if (self.filterIncrement !== currentIncrement) {
                                return;
                            }
                            filtersProcessors[i + 1](context, callbacks[i + 1]);
                        };
                    })(i);
                }
                callbacks[filtersProcessors.length - 1] = function() {
                    // If the increment has changed, do not call the callback.
                    // (We don't want OSD to draw an outdated tile in the canvas).
                    if (self.filterIncrement !== currentIncrement) {
                        return;
                    }
                    callback();
                };
                filtersProcessors[0](context, callbacks[0]);
            } else {
                for (var i = 0; i < filtersProcessors.length; i++) {
                    filtersProcessors[i](context, function() {
                    });
                }
            }
        }

        function tileDrawingHandler(event) {
            var tile = event.tile;
            var rendered = event.rendered;
            if (rendered._filterIncrement === self.filterIncrement) {
                return;
            }
            var processors = getFiltersProcessors(self, event.tiledImage);
            if (processors.length === 0) {
                if (rendered._originalImageData) {
                    // Restore initial data.
                    rendered.putImageData(rendered._originalImageData, 0, 0);
                    delete rendered._originalImageData;
                }
                rendered._filterIncrement = self.filterIncrement;
                return;
            }

            if (rendered._originalImageData) {
                // The tile has been previously filtered (by another filter),
                // restore it first.
                rendered.putImageData(rendered._originalImageData, 0, 0);
            } else {
                rendered._originalImageData = rendered.getImageData(
                    0, 0, rendered.canvas.width, rendered.canvas.height);
            }

            if (tile._renderedContext) {
                if (tile._filterIncrement === self.filterIncrement) {
                    var imgData = tile._renderedContext.getImageData(0, 0,
                        tile._renderedContext.canvas.width,
                        tile._renderedContext.canvas.height);
                    rendered.putImageData(imgData, 0, 0);
                    delete tile._renderedContext;
                    delete tile._filterIncrement;
                    rendered._filterIncrement = self.filterIncrement;
                    return;
                }
                delete tile._renderedContext;
                delete tile._filterIncrement;
            }
            applyFilters(rendered, processors);
            rendered._filterIncrement = self.filterIncrement;
        }
    };

    function setOptions(instance, options) {
        options = options || {};
        var filters = options.filters;
        instance.filters = !filters ? [] :
            $.isArray(filters) ? filters : [filters];
        for (var i = 0; i < instance.filters.length; i++) {
            var filter = instance.filters[i];
            if (!filter.processors) {
                throw new Error('Filter processors must be specified.');
            }
            filter.processors = $.isArray(filter.processors) ?
                filter.processors : [filter.processors];
        }
        instance.filterIncrement++;

        if (options.loadMode === 'sync') {
            instance.viewer.forceRedraw();
        } else {
            var itemsToReset = [];
            for (var i = 0; i < instance.filters.length; i++) {
                var filter = instance.filters[i];
                if (!filter.items) {
                    itemsToReset = getAllItems(instance.viewer.world);
                    break;
                }
                if ($.isArray(filter.items)) {
                    for (var j = 0; j < filter.items.length; j++) {
                        addItemToReset(filter.items[j], itemsToReset);
                    }
                } else {
                    addItemToReset(filter.items, itemsToReset);
                }
            }
            for (var i = 0; i < itemsToReset.length; i++) {
                itemsToReset[i].reset();
            }
        }
    }

    function addItemToReset(item, itemsToReset) {
        if (itemsToReset.indexOf(item) >= 0) {
            throw new Error('An item can not have filters ' +
                'assigned multiple times.');
        }
        itemsToReset.push(item);
    }

    function getAllItems(world) {
        var result = [];
        for (var i = 0; i < world.getItemCount(); i++) {
            result.push(world.getItemAt(i));
        }
        return result;
    }

    function getFiltersProcessors(instance, item) {
        if (instance.filters.length === 0) {
            return [];
        }

        var globalProcessors = null;
        for (var i = 0; i < instance.filters.length; i++) {
            var filter = instance.filters[i];
            if (!filter.items) {
                globalProcessors = filter.processors;
            } else if (filter.items === item ||
                $.isArray(filter.items) && filter.items.indexOf(item) >= 0) {
                return filter.processors;
            }
        }
        return globalProcessors ? globalProcessors : [];
    }

    function _sanitizeValue(v) {
        if (isNaN(v)) return 0;
        return Math.min(Math.max(v, 0), 1);
    }

    function _isInteger(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    }

    function _isNumber(value) {
        return typeof value === 'number';
    }

    /**
     * inout: 0-255, 0-255, 0-255
     * output: [[0-360], [0-1], [0-1]]
     */
    function _rgb2hsv(r, g, b, onlyV) {
        var r1 = r / 255,
            g1 = g / 255,
            b1 = b / 255;

        var maxc = Math.max(r1, g1, b1),
            minc = Math.min(r1, g1, b1);

        var h, s, v, rc, gc, bc;

        v = maxc;

        if (onlyV) {
            return v;
        }

        if (minc == maxc) {
            return [0, 0, v];
        }

        s = (maxc - minc) / maxc;
        rc = (maxc - r1) / (maxc - minc);
        gc = (maxc - g1) / (maxc - minc);
        bc = (maxc - b1) / (maxc - minc);

        if (r == maxc) {
            h = bc - gc;
        } else if (g == maxc) {
            h = 2.0 + rc - bc;
        } else {
            h = 4.0 + gc - rc;
        }

        h = (h/6.0) % 1.0;
        return [h * 360, s, v]
    }

    /**
     * input: [[0-360], [0-1], [0-1]]
     * output: 0-255, 0-255, 0-255
     */
    function _hsv2rgb (h, s, v) {
        var h1 = h / 360, s1 = s, v1 = v;

        var output = function (r, g, b) {
            return [r * 255, g * 255, b * 255];
        }

        var i, f, p, q, t;

        if (s1 === 0) {
            return output(v1, v1, v1)
        }
        i = parseInt(h1 * 6.0);
        f = (h1 * 6.0) - i;
        p = v1 * (1.0 - s1);
        q = v1 * (1.0 - (s1 * f));
        t = v1 * (1.0 - (s1 * (1.0-f)));
        i = i % 6;

        if (i == 0) {
            return output(v1, t, p);
        }
        if (i == 1) {
            return output(q, v1, p);
        }
        if (i == 2) {
            return output(p, v1, t);
        }
        if (i == 3) {
            return output(p, q, v1);
        }
        if (i == 4) {
            return output(t, p, v1);
        }
        if (i == 5) {
            return output(v1, p, q);
        }
    }

    function _updateYValue(hist, yScale) {
        var y = yScale.y;
        var data = hist.log ? hist.logData : hist.data;


        // Update the Y axis
        y.domain([0, d3.max(data, function(d) { return d[yScale.label] }) ]);

        // Create the u variable
        var u = hist.graph.svg.selectAll(".histogram-bar-" + yScale.label).data(data);

        // u.exit().remove();

        // existing value
        u.enter()
            .append("rect") // Add a new rect for each new elements
            .merge(u) // get the already existing elements as well
            .transition() // and apply changes to all of them
            .duration(1000)
            .attr("x", function(d) { return hist.graph.x(d.label); })
            .attr("y", function(d) { return y(d[yScale.label]); })
            .attr("width", hist.graph.x.bandwidth())
            .attr("height", function(d) { return colorHistHeight - y(d[yScale.label]); })
            .attr("class", "histogram-bar " + "histogram-bar-" + yScale.label)
            .attr("fill", yScale.color)

        // If less group in the new dataset, I delete the ones not in use anymore
        u.exit().remove();
    }

    function _drawHistograms() {
        console.log("drawing histogram");

        colorHistOriginal.graph.series.forEach(function (item) {
            _updateYValue(colorHistOriginal, item);
        });

        colorHist.graph.series.forEach(function (item) {
            _updateYValue(colorHist, item);
        });
    }

    function _createHistogram(hist, selector) {
        // append the svg object to the body of the page
        hist.graph.svg = d3.select(selector)
            .append("svg")
                .attr("width", colorHistWidth + colorHistMargin.left + colorHistMargin.right)
                .attr("height", colorHistHeight + colorHistMargin.top + colorHistMargin.bottom)
            .append("g")
                .attr("transform", "translate(" + colorHistMargin.left + "," + colorHistMargin.top + ")");


        // Initialize the X axis
        hist.graph.x = d3.scaleBand()
            .range([ 0, colorHistWidth ])
            .domain(Array.from(Array(101).keys()))
            .padding(0.2);

        var xAxis = d3.axisBottom(hist.graph.x)
            .tickSize(11)
            .tickValues([25, 50, 75])
            .tickFormat(function(n) { return n + "%"});

        hist.graph.svg.append("g")
            .attr("class", "histogram-axis")
            .attr("transform", "translate(0," + colorHistHeight + ")")
            .call(xAxis);

        // Initialize the Y axis
        hist.graph.svg.append("g")
            .attr("class", "histogram-axis");

        hist.graph.series = [
            {
                y: d3.scaleLinear().range([ colorHistHeight, 0]),
                label: "value",
                color: "#ccc"
            }
        ];

        hist.graph.svg.selectAll(".histogram-legend")
            .data(hist.graph.series)
            .enter()
            .append('g')
            .append("text")
            .attr("class", function(d) { return "histogram-legend histogram-legend-" + d.label; })
            .attr("y", 0)
            // .attr("x", function(d,i){ return 30 + i*60})
            .attr("x", function(d,i){ return [30, 90, 135, 200][i]})
            .text(function(d) { return d.label; })
            .style("fill", function(d, i){ return (d.color) })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("font-size", 15)
            .on("click", function(d, i){
                // is the element currently visible ?
                var chartSelector = selector + " .histogram-bar-" + d.label,
                    legendSelector = selector + " .histogram-legend-" + d.label;

                try {
                    var currentOpacity = d3.selectAll(chartSelector).style("opacity");

                    if (currentOpacity == 0.5) {
                        d3.selectAll(chartSelector).transition().style("opacity", 0);
                        d3.selectAll(legendSelector).transition().style("text-decoration", "line-through");
                    } else {
                        d3.selectAll(chartSelector).transition().style("opacity", 0.5);
                        d3.selectAll(legendSelector).transition().style("text-decoration", "none");
                    }
                } catch (exp) {
                    // there might not be any data
                }
            });
    }

    var showColorHistogram = false, colorHistMargin, colorHistWidth, colorHistHeight;
    var colorHist = {
        data: [], logData: [], log: false, graph: {svg: null, x: null, series: []}
    };
    var colorHistOriginal = {
        data: [], logData: [], log: false, graph: {svg: null, x: null, series: []}
    };
    function _emptyData (hist) {
        if (!showColorHistogram) return;

        for (var i = 0; i <= 100; i++) {
            hist.data[i] = {
                label: i,
                value: 0
            };
        }
    };

    $.Viewer.prototype.initializeColorHistogram = function () {
        showColorHistogram = true;

        // show the container
        document.querySelector('#color-histogram-container').style.display = "block";

        // toggle hist buttons
        document.querySelector('#color-histogram-btn').onclick = function () {
            var h = document.querySelector('#color-histogram');
            h.style.display = (h.style.display == "none") ? "block" : "none";
        };
        document.querySelector('#color-histogram-original-btn').onclick = function () {
            var h = document.querySelector('#color-histogram-original');
            h.style.display = (h.style.display == "none") ? "block" : "none";
        };

        // toggle scale button
        d3.select("#color-histogram-scale-checkbox input").on("click", function () {
            colorHist.log = this.checked;
            colorHistOriginal.log = this.checked;
            _drawHistograms();
        });


        // set the dimensions and margin of the graph
        colorHistMargin = {top: 40, right: 20, bottom: 90, left: 40},
        colorHistWidth = 600 - colorHistMargin.left - colorHistMargin.right,
        colorHistHeight = 300 - colorHistMargin.top - colorHistMargin.bottom;

        _createHistogram(colorHistOriginal, "#color-histogram-original");;
        _createHistogram(colorHist, "#color-histogram");;
    }

    $.Viewer.prototype.drawColorHistogram = function () {
        if (!showColorHistogram) return;

        colorHist.logData = [];
        colorHist.data.forEach(function (d, i) {
            colorHist.logData[i] = {};
            for (var k in d) {
                if (k != "label") {
                    colorHist.logData[i][k] = (d[k] == 0) ? 0 : (Math.log(d[k]) / Math.log(10));
                } else {
                    colorHist.logData[i][k] = d[k];
                }
            }
        });

        colorHistOriginal.logData = [];
        colorHistOriginal.data.forEach(function (d, i) {
            colorHistOriginal.logData[i] = {};
            for (var k in d) {
                if (k != "label") {
                    colorHistOriginal.logData[i][k] = (d[k] == 0) ? 0 : (Math.log(d[k]) / Math.log(10));
                } else {
                    colorHistOriginal.logData[i][k] = d[k];
                }
            }
        });

        _drawHistograms();
    }

    $.Filters = {
        VERSION: "1.0",

        CHANGE_COLOR: function (name, contrast, brightness, gamma, saturation, hue, greyscale, isInit) {
            if (!_isNumber(contrast)) {
                contrast = 1;
            }
            // contrast = Math.pow(10, contrast);

            if (!_isNumber(brightness) || brightness > 1 || brightness < -1) {
                brightness = 0;
            }

            if (!_isNumber(gamma) || gamma < 0) {
                gamma = 0;
            }

            // TODO saturation
            if (!_isNumber(saturation) || saturation > 100 || saturation < 0) {
                saturation = 100;
            }
            saturation = saturation / 100;

            // if it's an rgb image, we shouldn't change the saturation or hue
            var rgbImg = false;
            if (!_isNumber(hue) || hue > 360 || hue < 0) {
                rgbImg = true;
            }

            if (showColorHistogram) {
                if (isInit) {
                    _emptyData(colorHistOriginal);
                }
                _emptyData(colorHist);
            }

            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    // turn rgb to hsv
                    var hsv = _rgb2hsv(pixels[i], pixels[i+1], pixels[i+2]);

                    var newVal = _sanitizeValue( Math.pow( _sanitizeValue(((hsv[2] - 0.5) * contrast) + 0.5 + brightness), gamma) );

                    var col = _hsv2rgb(
                        rgbImg ? hsv[0] : hue,  // hue
                        greyscale ? 0 : (rgbImg ? hsv[1] : saturation), // saturation
                        newVal // value
                    );

                    if (showColorHistogram) {
                        if (isInit) {
                            colorHistOriginal.data[Math.floor(hsv[2]*100)].value++;
                        }

                        colorHist.data[Math.floor(newVal*100)].value++;
                    }


                    pixels[i] = col[0];
                    pixels[i+1] = col[1];
                    pixels[i+2] = col[2];
                }
                context.putImageData(imgData, 0, 0);
                callback();
            }
        },
    };
})();
