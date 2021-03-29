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

    var showColorHistogram = false, colorHistMargin, colorHistWidth, colorHistHeight;
    var colorHist = {
        data: [], logData: [], log: false, graph: {selector: "#color-histogram", svg: null, x: null, series: []}
    };
    var colorHistOriginal = {
        data: [], logData: [], log: false, graph: {selector: "#color-histogram-original", svg: null, x: null, series: []}
    };
    function _emptyData (hist, label) {
        if (!showColorHistogram) return;

        for (var i = 0; i <= 100; i++) {
            if (label) {
                if (!hist.data[i]) {
                    hist.data[i] = {};
                }
                hist.data[i][label] = 0;
            } else {
                hist.data[i] = {};
            }
        }
    };
    
    // create a histogram
    function _createHistogram(hist) {
        // append the svg object to the body of the page
        hist.graph.svg = d3.select(hist.graph.selector)
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

    }

    // update the displayed value of y in the given histogram
    function _updateYValue(hist, yScale) {
        var y = yScale.y;
        var data = hist.log ? hist.logData : hist.data;


        // Update the Y axis
        y.domain([0, d3.max(data, function(d) { return d[yScale.label] }) ]);

        // Create the u variable
        var u = hist.graph.svg.selectAll(".histogram-bar-" + yScale.label_no_space).data(data);

        // u.exit().remove();

        // existing value
        u.enter()
            .append("rect") // Add a new rect for each new elements
            .merge(u) // get the already existing elements as well
            .transition() // and apply changes to all of them
            .duration(1000)
            .attr("x", function(d, i) { return hist.graph.x(i); })
            .attr("y", function(d) { 
                var res = y(d[yScale.label])
                return isNaN(res) ? 0 : res; 
            })
            .attr("width", hist.graph.x.bandwidth())
            .attr("height", function(d) { 
                var res = colorHistHeight - y(d[yScale.label]);
                return isNaN(res) ? 0 : res; 
            })
            .attr("class", "histogram-bar " + "histogram-bar-" + yScale.label_no_space)
            .attr("fill", yScale.color)

        // If less group in the new dataset, I delete the ones not in use anymore
        u.exit().remove();
    }
    
    var usedBarColors = [];
    // add a y value series
    function _addSeries (hist, label, color) {
        var el = {
            y: d3.scaleLinear().range([ colorHistHeight, 0]),
            label: label,
            label_no_space: label.replaceAll(" ", ""),
            color: color
        };
        
        var x_pos = 30, before;
        if (hist.graph.series.length > 0) {
            before = hist.graph.series[hist.graph.series.length-1];
            x_pos = before.legend_x_pos + (before.label.length*8) + 15;
        }
        
        el.legend_x_pos = x_pos;
        
        hist.graph.series.push(el);
        
        hist.graph.svg.select("g.histogram-legend")

        hist.graph.svg.selectAll(".histogram-legend")
            .data(hist.graph.series)
            .enter()
            .append('g')
            .append("text")
            .attr("class", function(d) { return "histogram-legend histogram-legend-" + d.label_no_space; })
            .attr("y", 0)
            .attr("x", function (d) {return d.legend_x_pos;})
            .text(function(d) { return d.label; })
            .style("fill", function(d){ return (d.color) })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("font-size", 15)
            .on("click", function(d){
                var chartSelector = hist.graph.selector + " .histogram-bar-" + d.label_no_space,
                    legendSelector = hist.graph.selector + " .histogram-legend-" + d.label_no_space;

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
    
    // draw the histograms
    function _drawHistograms() {
        console.log("drawing histogram");

        colorHistOriginal.graph.series.forEach(function (item) {
            _updateYValue(colorHistOriginal, item);
        });

        colorHist.graph.series.forEach(function (item) {
            _updateYValue(colorHist, item);
        });
    }

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

        _createHistogram(colorHistOriginal);
        _createHistogram(colorHist);
        
        _emptyData(colorHistOriginal);
        _emptyData(colorHist);
    }

    $.Viewer.prototype.drawColorHistogram = function () {
        if (!showColorHistogram) return;

        colorHist.logData = [];
        colorHist.data.forEach(function (d, i) {
            colorHist.logData[i] = {};
            for (var k in d) {
                colorHist.logData[i][k] = (d[k] == 0) ? 0 : (Math.log(d[k]) / Math.log(10));
            }
        });

        colorHistOriginal.logData = [];
        colorHistOriginal.data.forEach(function (d, i) {
            colorHistOriginal.logData[i] = {};
            for (var k in d) {
                colorHistOriginal.logData[i][k] = (d[k] == 0) ? 0 : (Math.log(d[k]) / Math.log(10));
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
                    _emptyData(colorHistOriginal, name);
                    
                    var color = window.OSDViewer.utils.generateColor(usedBarColors);
                    usedBarColors.push(color);
                    _addSeries(colorHist, name, color);
                    _addSeries(colorHistOriginal, name, color);
                }
                _emptyData(colorHist, name);
            }

            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    // turn rgb to hsv
                    var hsv = window.OSDViewer.utils.rgb2hsv(pixels[i], pixels[i+1], pixels[i+2]);

                    var newVal = _sanitizeValue( Math.pow( _sanitizeValue(((hsv[2] - 0.5) * contrast) + 0.5 + (brightness * contrast)), gamma) );

                    var col = window.OSDViewer.utils.hsv2rgb(
                        rgbImg ? hsv[0] : hue,  // hue
                        greyscale ? 0 : (rgbImg ? hsv[1] : saturation), // saturation
                        newVal // value
                    );

                    if (showColorHistogram) {
                        if (isInit) {
                            var origEl = colorHistOriginal.data[Math.floor(hsv[2]*100)];
                            if (!(name in origEl)) {
                                origEl[name] = 0;
                            }
                            origEl[name]++;
                        }
                        
                        var el = colorHist.data[Math.floor(newVal*100)];
                        if (!(name in el)) {
                            el[name] = 0;
                        }
                        el[name]++;
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
