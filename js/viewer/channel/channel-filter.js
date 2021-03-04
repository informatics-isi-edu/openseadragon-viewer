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
        return Math.min(Math.max(v, 0), 100);
    }

    function _isInteger(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    }

    function _isNumber(value) {
        return typeof value === 'number';
    }

    function _rgb2hsv(r, g, b, onlyV) {
        var r1 = r / 255,
            g1 = g / 255,
            b1 = b / 255;

        var maxc = Math.max(r1, g1, b1),
            minc = Math.min(r1, g1, b1);

        var h, s, v, rc, gc, bc;

        v = maxc;

        if (onlyV) {
            return v * 100;
        }

        if (minc == maxc) {
            return [0, 0, v * 100];
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
        return [h * 360, s * 100, v * 100]
    }

    function _hsv2rgb (h, s, v) {
        var h1 = h / 360, s1 = s / 100, v1 = v / 100;

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

    $.Filters = {
        VERSION: "0.1",

        CHANGE_COLOR: function (contrast, brightness, gamma, saturation, hue, greyscale) {
            if (!_isNumber(contrast) || contrast > 1 || contrast < -1) {
                contrast = 0;
            }
            contrast = Math.pow(10, contrast);

            if (!_isNumber(brightness) || brightness > 100 || brightness < -100) {
                brightness = 0;
            }

            if (!_isNumber(gamma) || gamma < 0) {
                gamma = 0;
            }

            // TODO saturation
            if (!_isNumber(saturation) || saturation > 100 || saturation < -100) {
                saturation = 100;
            }

            // if it's an rgb image, we shouldn't change the saturation or hue
            var rgbImg = false;
            if (!_isNumber(hue) || hue > 360 || hue < 0) {
                rgbImg = true;
            }

            console.log("using ", contrast);

            var precomputedRes = [];
            for (var i = 0; i < 100; i++) {
                precomputedRes[i] = _sanitizeValue( Math.pow( (((i - 50) * contrast) + 50 + brightness)/ 100, gamma) * 100 )
            }

            return function(context, callback) {
                var imgData = context.getImageData(
                    0, 0, context.canvas.width, context.canvas.height);
                var pixels = imgData.data;
                for (var i = 0; i < pixels.length; i += 4) {
                    // turn rgb to hsv
                    var hsv = _rgb2hsv(pixels[i], pixels[i+1], pixels[i+2]);


                    var col = _hsv2rgb(
                        rgbImg ? hsv[0] : hue,  // hue
                        greyscale ? 0 : (rgbImg ? hsv[1] : saturation), // saturation
                        // _sanitizeValue( Math.pow( (((hsv[2] - 50) * contrast) + 50 + brightness)/ 100, gamma) * 100 ) // value
                        precomputedRes[Math.floor(hsv[2])]
                    );
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
