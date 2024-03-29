function Utils(){
    this.channelNamesOverlay = new ChannelNamesOverlayUtils();
};

Utils.prototype.queryForRetina = function(canvas) {
  // query for various pixel ratios
   var ctxt = canvas.getContext("2d");
   var devicePixelRatio = window.devicePixelRatio || 1;
   var backingStoreRatio = ctxt.webkitBackingStorePixelRatio ||
                           ctxt.mozBackingStorePixelRatio ||
                           ctxt.msBackingStorePixelRatio ||
                           ctxt.oBackingStorePixelRatio ||
                           ctxt.backingStorePixelRatio || 1;
    var pixelDensityRatio = devicePixelRatio / backingStoreRatio;

    return pixelDensityRatio;
}

// Add attribution watermark

Utils.prototype.addWaterMark2Canvas = function (canvas, watermark, scalebar, channelData) {
    if(!watermark || !canvas) return;

    var fsize = 20,
        h = canvas.height,
        w = canvas.width,
        l = Math.floor(w / 20),
        ctx = canvas.getContext("2d"),
        sLoc;

    ctx.save();

    if (l < fsize){
        // cap it at 20
        fsize = l;
    }


    // var myScalebarInstance = myViewer.scalebarInstance;
    // if (scalebar) {
    //
    // }
    var barHeight = scalebar.divElt.offsetHeight;
    var container = scalebar.viewer.container;
    var x = 0;
    var y = container.offsetHeight - barHeight;
    var pixel = scalebar.viewer.viewport.pixelFromPoint(
            new OpenSeadragon.Point(0, 1 / scalebar.viewer.source.aspectRatio),
            true);
    if (!scalebar.viewer.wrapHorizontal) {
        x = Math.max(x, pixel.x);
    }
    if (!scalebar.viewer.wrapVertical) {
        y = Math.min(y, pixel.y - barHeight);
    }

    // for the retina case get the pixel density ratio
    // for non retina, this value is 1
    var pixelDensityRatio = this.queryForRetina(canvas);
    x = x*pixelDensityRatio;
    y = y*pixelDensityRatio;
    x = x + scalebar.xOffset;
    y = y - scalebar.yOffset;

    // if has scalebar, associate with it
    // if (scalebar) {
    //     sLoc = scalebar.getScalebarLocation()
    //     wx = sLoc.x + scalebar.divElt.offsetWidth - 10;
    //     fsize = scalebar.divElt.offsetWidth / 3;
    // } else {
    //     wx = w - fsize;
    // }

    // ctx.translate(5, h - fsize / 3 - 5);
    // fill a black rectangle as a background for the watermark
    ctx.font = fsize+"pt Sans-serif";
    var rectWidth = Math.ceil(ctx.measureText(watermark).width);
    ctx.fillStyle = 'rgb(208, 224, 240)';
    ctx.fillRect(x, y-scalebar.yOffset, rectWidth, fsize+scalebar.yOffset);

    // fill the watermark in the rectangle
    ctx.textAlign = "left";
    ctx.fillStyle = "rgb(51, 51, 51)";
    ctx.fillText(watermark,x,y+scalebar.yOffset);

    // add channel names overlay
    this.channelNamesOverlay.addChannelNames2Canvas(ctx, channelData, w);

    ctx.restore();
    // return ctx;
}

// Get file content from a url
Utils.prototype.getUrlContent = function(url){
    var http = new XMLHttpRequest(),
        res = null;

    http.open("GET", url, false);
    http.send(null);

    res = http.status != 404 ? http.responseText : false;
    return res;
}

// given a url, return the query params object
Utils.prototype.getQueryParams = function (url) {
    var idx = url.lastIndexOf("?"), params = {};
    var queries = url.slice(idx+1).split("&");

    for (var i = 0; i < queries.length; i++) {
        var q_parts = queries[i].split("=");
        if (q_parts.length != 2) continue;

        // NOTE: we're not decoding anything
        var q_key = q_parts[0], q_val = q_parts[1];

        if (!(q_key in params)) {
            params[q_key] = [];
        }

        params[q_key].push(q_val);
    }

    return params;
};

// given the parameters object, process it
Utils.prototype.processParams = function(inp){
    var EMPTY = "null"; // this value should be ignored on all the attributes
    var parameters = {}, self = this, paramKey, paramValue, value;

    parameters.mainImage = {
        zIndex: 0,
        info: [] // {url, channelNumber}
    };
    parameters.channels = []; // [{channelNumber, channelName, aliasName, isRGB, pseudoColor}]
    parameters.annotationSetURLs = []; // [""]
    parameters.zPlane = {
        count: 1,
        minZIndex: null,
        maxZIndex: null
    };

    if (!inp) {
        return parameters;
    }

    for (paramKey in inp) {
        paramValue = inp[paramKey];

        // TODO this could be improved,
        // currently the params might be string or array
        if (!Array.isArray(paramValue)) {
            paramValue = [paramValue];
        }

        switch(paramKey){
            // array of urls
            case "url":
                paramValue.forEach(function (value) {
                    // Parameter.type are of 3 types : svg - for annotation overlay, iiif - files containing info.json and all the other file formats are treated as rest
                    // Note : SVG file could also used in other image types as well, needs to check the use case and modify in the future
                    // TODO the path of svg files are hardcoded and need to change
                    if(value.indexOf(".svg") != -1 || value.indexOf('resources/gene_expression/annotations') != -1){
                        parameters.annotationSetURLs = parameters.annotationSetURLs || [];
                        parameters.annotationSetURLs.push(value);
                        return;
                    }

                    parameters.mainImage.info.push({
                        url: value,
                        channelNumber: parameters.mainImage.info.length
                    });
                });
                break;
            // array of string
            case "aliasName":
            case "channelName":
                paramValue.forEach(function (value, index) {
                    if( (value[0] == "\"" && value[value.length-1] == "\"") || (value[0] == "\'" && value[str.length-1] == "\'")){
                        value = value.substr(1,value.length-2);
                    }
                    value = value.length > 0 && value !== EMPTY ? decodeURI(value) : null;
                    if (!parameters.channels[index]) {
                        parameters.channels[index] = {
                            channelNumber: index
                        };
                    }
                    parameters.channels[index][paramKey] = value;
                });
                break;
            // array of boolean
            case "isRGB":
                paramValue.forEach(function (value, index) {
                    if (["true", "false"].indexOf(value) != -1) {
                        value = (value === "true");
                    } else {
                        value = null;
                    }
                    if (!parameters.channels[index]) {
                        parameters.channels[index] = {};
                    }
                    parameters.channels[index][paramKey] = value;
                });
                break;
            // array of color
            case "pseudoColor":
                paramValue.forEach(function (value, index) {
                    value = self.colorHexToRGB(decodeURI(value));
                    if (!parameters.channels[index]) {
                        parameters.channels[index] = {};
                    }
                    parameters.channels[index][paramKey] = value;
                });
                break;
            case "zIndex":
                value = paramValue[0];
                if( (value[0] == "\"" && value[value.length-1] == "\"") || (value[0] == "\'" && value[str.length-1] == "\'")){
                    value = value.substr(1,value.length-2);
                }
                if (value.length > 0 && value !== EMPTY) {
                    parameters.mainImage.zIndex = value;
                }
                break;
            // string
            case "zoomLineThickness":
            case "waterMark":
                value = paramValue[0];
                if( (value[0] == "\"" && value[value.length-1] == "\"") || (value[0] == "\'" && value[str.length-1] == "\'")){
                    value = value.substr(1,value.length-2);
                }
                if (value.length > 0 && value !== EMPTY) {
                    parameters[paramKey] = decodeURI(value);
                }
                break;
            // float
            case "meterScaleInPixels":
            case "scale":
            case "x":
            case "y":
            case "z":
                value = parseFloat(paramValue[0]);
                if(!isNaN(value)){
                    parameters[paramKey] = value;
                }
                break;
            // boolean
            case "ignoreReferencePoint":
            case "ignoreDimension":
            case "enableSVGStrokeWidth":
            case "showHistogram":
                parameters[paramKey] = (paramValue[0].toLocaleLowerCase() === "true") ? true : false;
                break;
            default:
                console.log("unknown query parameter: " + paramKey);
        }
    }
    console.log("------");
    console.log("OSD viewer parameters: ", parameters);
    console.log("------");
    return parameters;
}

/**
 * Given an string for a color, turn it into a standard hex value
 * @param {string} color
 */
Utils.prototype.standardizeColor = function (color) {
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color;
    return ctx.fillStyle;
};

// Generate a random color
Utils.prototype.generateColor = function(usedColors){
    var letters = '0123456789abcdef',
        color = '#',
        i;

    var colorPallete = ["#d5ff00", "#00ff00", "#ff937e", "#91d0cb", "#0000ff",
        "#00ae7e", "#ff00f6", "#5fad4e", "#01d0ff", "#bb8800", "#bdc6ff", "#008f9c",
        "#a5ffd2", "#ffa6fe", "#ffdb66", "#00ffc6", "#00b917", "#bdd393", "#004754",
        "#010067", "#0e4ca1", "#005f39", "#6b6882", "#683d3b", "#43002c", "#788231"];

    //find a color from the pallete that is not used
    for (i = 0; i < colorPallete.length; i++) {
        if (usedColors.indexOf(colorPallete[i]) === -1) {
            return colorPallete[i];
        }
    }

    // otherwise generate a random color
    for (i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Converrt the given hex string to RGB color format that channel code understands
 * The returned format: '#.###### #.###### #.######'
 * If the given input is not properly formatted, this function will return null.
 */
Utils.prototype.colorHexToRGB = function (val) {
    var res = null;

    if (typeof val !== "string" || val.length === 0) {
        return res;
    }

    // support shorthand syntax (#ccc)
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    val = val.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var parts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(val);
    if (parts) {
        res = (parseInt(parts[1], 16) / 255).toFixed(6)
        res += " " + (parseInt(parts[2], 16) / 255).toFixed(6)
        res += " " + (parseInt(parts[3], 16) / 255).toFixed(6)
    }

    return res;
}

/**
 * Converrt the RGB color format that channel code understands
 * ('#.###### #.###### #.######') to proper hex value.
 * If the given input is not properly formatted, this function will return null.
 */
Utils.prototype.colorRGBToHex = function (val) {
    if (typeof val !== "string" || val.length === 0) {
        return null;
    }

    var isInvalid = false;
    var rgb = val.split(" ").map(function (c) {
        // parse string into float
        c = parseFloat(c);

        // make sure it's valid
        if (isInvalid || c == NaN) {
            isInvalid = true;
            return;
        }

        // change to 0-255 format
        c = c * 255;

        // turn into hex
        var hex = c.toString(16).toUpperCase();
        return hex.length == 1 ? "0" + hex : hex;
    });

    if (rgb.length != 3 || isInvalid) {
        return null;
    }

    return "#" + rgb.join("");
}

/**
 * Convert 8bit r-g-b values to hsv
 * borrowed from: https://stackoverflow.com/a/17243070
 * inout: 0-255, 0-255, 0-255
 * output: [[0-360], [0-1], [0-1]]
 */
Utils.prototype.rgb2hsv = function (r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [Math.round(h*360), s , v];
}

/**
 * Convert hsv to 8bit r-g-b values
 * borrowed from: https://stackoverflow.com/a/17243070
 * input: [[0-360], [0-1], [0-1]]
 * output: 0-255, 0-255, 0-255
 */
Utils.prototype.hsv2rgb = function (h, s, v) {
    var r, g, b, i, f, p, q, t;

    h = h / 360;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Given a hue value, return the hex value represting its full color
 * @param {number} hue
 * @returns a string representing the hex color
 */
Utils.prototype.getColorHexForHue = function (hue) {
    var res = this.hsv2rgb(hue,1,1);
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(res[0]) + componentToHex(res[1]) + componentToHex(res[2]);
};

// Detect user's browser
Utils.prototype.getUserBrowserType = function(){

    var browser = null,
        detectResult = {
            FIREFOX : false,
            SAFARI : false,
            IE : true,
            EDGE : false,
            CHROME : false
        };

    // Firefox 1.0+
    detectResult["FIREFOX"] = typeof InstallTrigger !== 'undefined';
    // Safari 3.0+ "[object HTMLElementConstructor]"
    detectResult["SAFARI"] = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
    // Internet Explorer 6-11
    detectResult["IE"] = /*@cc_on!@*/false || !!document.documentMode;
    // Edge 20+
    detectResult["EDGE"] = !detectResult["IE"] && !!window.StyleMedia;
    // Chrome 1 - 71
    detectResult["CHROME"] = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

    for(browser in detectResult){
        if(detectResult[browser]){
            break;
        }
    }
    return browser;
};

// Download and output the data as a file
Utils.prototype.downloadAsFile = function(fileName, dataUrl){

    var link = document.createElement("a"),
        currentBrowser = this.getUserBrowserType(),
        date,
        blob;

    if(!fileName){
        date = new Date().getTime();
        fileName = "OSD_" + date.toString();
    };

    switch(currentBrowser){
        case "CHROME":
            document.body.append(link);
            link.href = dataUrl;
            link.download = fileName;
            link.style.display = "none";
            link.click();
            window.URL.revokeObjectURL(link.href);
            link.remove();
            break;
        case "FIREFOX":
        case "EDGE":
            link.href = dataUrl;
            link.download = fileName;
            link.innerHTML = "Download Image File";
            link.style.display = 'none';
            link.onclick = function(event){
                document.body.removeChild(event.target);
            }
            document.body.appendChild(link);
            link.click();
            delete link;
            break;
        case "SAFARI":
            dataUrl = dataUrl.replace("image/jpeg", "application/octet-stream");
            document.location.href = dataUrl;
            break;
        case "IE":
            blob = dataUriToBlob(dataUrl);
            window.navigator.msSaveBlob(blob, fileName);
            break;
    }


}

Utils.prototype.round = function (value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

/**
 * This function return the width of a given string and font size
 * @param {String} text
 * @param {Int} font
 * @returns {Int}
 */
Utils.prototype.getTextWidth = function (text, font) {
    this.element = document.createElement('canvas');
    this.context = this.element.getContext("2d");
    this.context.font = font + 'pt Sans-serif';
    return this.context.measureText(text).width;
}

function ChannelNamesOverlayUtils() { }

/**
 * This function adds channel names to the screenshot
 * @param {canvas context} ctx
 * @param {Array} channelData
 * @param {Int} w
 */
ChannelNamesOverlayUtils.prototype.addChannelNames2Canvas = function (ctx, channelData, w) {
    if (!Array.isArray(channelData) || channelData.length === 0) {
        return;
    }

    var constants = window.OSDViewer.constants.CHANNEL_NAMES_OVERLAY_CONFIG

    // Find the font size that would fit all the content
    var newFont = this.getFontSizeForCanvas(ctx, channelData, w)
    ctx.font = newFont + "pt Sans-serif";

    // Update the channel names to the they can fit in a single line, if the name is too long by truncating the name & add ...
    for (let i = 0; i < channelData.length; i++) {
        channelData[i][0] = this.getUpdatedChannelNameForCanvas(channelData[i][0], ctx, w);
    }

    // start adding the words to the canvas
    var start = 0, end = 0, line = 0;
    while (start < channelData.length && line < constants.MAX_LINES) {

        // find how many names can fit in a single line
        var lineWidth = 0
        while (end < channelData.length && lineWidth + ctx.measureText(channelData[end][0]).width < constants.USABLE_AREA * w) {
            lineWidth += ctx.measureText(channelData[end][0]).width + 20;
            end += 1;
        }
        var hasMore = true;
        if (end >= channelData.length) {
            hasMore = false
        }

        // draw the line & names
        this.addChannelLineToCanvas(ctx, channelData.slice(start, end), line, w, hasMore);
        line += 1;
        start = end;
    }
}

/**
 * This function returns the updated channel name, i.e. if the channel name wont fit in a single line, it add ...
 * TODO could potentially be merged with the other function used for overlay
 * @param {String} channelName
 * @param {canvas context} ctx
 * @param {Int} canvasWidth
 * @returns {String}
 */
ChannelNamesOverlayUtils.prototype.getUpdatedChannelNameForCanvas = function (channelName, ctx, canvasWidth) {
    var constants = window.OSDViewer.constants.CHANNEL_NAMES_OVERLAY_CONFIG

    // if the channel name fits return the name as it is
    if (ctx.measureText(channelName).width < canvasWidth * constants.USABLE_AREA) {
        return channelName;
    }

    for (let i = channelName.length - 1; i >= 0; i--) {
        // starrt removing chnaraters from the right one at a time, until the name would fit
        if (ctx.measureText(channelName.slice(0, i) + '...').width < canvasWidth * constants.USABLE_AREA) {
            // return the updated name
            return channelName.slice(0, i) + '...';
        }
    }
}

/**
 * This function returns the updated channel name,
 * i.e. if the channel name wont fit in a single line, it add ...
 * @param {String} channelName
 * @param {Int} containerWidth
 * @param {Int} font
 * @returns {String}
 */
 ChannelNamesOverlayUtils.prototype.getUpdatedChannelName = function (channelName, containerWidth, font) {
    var constants = window.OSDViewer.constants.CHANNEL_NAMES_OVERLAY_CONFIG,
        utils = window.OSDViewer.utils;

    // if the channel name fits return the name as it is
    if (utils.getTextWidth(channelName, font) + 40 < containerWidth * constants.USABLE_AREA) {
        return channelName;
    }

    for (let i = channelName.length - 1; i >= 0; i--) {

        // starrt removing chnaraters from the right one at a time, until the name would fit
        if (utils.getTextWidth(channelName.slice(0, i) + '...', font) + 40 < containerWidth * constants.USABLE_AREA) {
            // return the updated name
            return channelName.slice(0, i) + '...';
        }
    }
}

/**
 * This function returns the font size which will be used in the screenshot.
 * We start with font 20 and reduce it by 2 until the channel data can fit into the canvas. The min font size is 14.
 *
 * TODO could potentially be merged with the other function used for overlay
 * @param {canvas context} ctx
 * @param {Array} channelData
 * @param {Int} canvasWidth
 * @returns {Int}
 */
ChannelNamesOverlayUtils.prototype.getFontSizeForCanvas = function (ctx, channelData, canvasWidth) {
    var constants = window.OSDViewer.constants.CHANNEL_NAMES_OVERLAY_CONFIG

    var font = constants.MAX_FONT;
    var maxLines = constants.MAX_LINES

    while (font > 14) {
        // min font value would be 14

        var curWidth = 0;
        var curLine = 0
        ctx.font = font + "pt Sans-serif";
        var i;

        for (i = 0; i < channelData.length && curLine < maxLines; i++) {
            // add each channel name
            curWidth += ctx.measureText(channelData[i][0]).width + 20
            if (i + 1 < channelData.length && curWidth + ctx.measureText(channelData[i + 1][0]).width + 20 >= constants.USABLE_AREA * canvasWidth) {
                // if the next name wont fit in the current line, add a new line
                curWidth = 0
                curLine += 1
            }
        }

        if (i == channelData.length) {
            // if all the data fit, then return the current font
            return font;
        }

        // reduce the font size by 2, as the channel data did not fit
        font -= 2;
    }

    return Math.max(constants.MIN_FONT, font);
}

/**
 * This function returns the font size which will be used in the overlay.
 * We start with font 20 and reduce it by 2 until the channel data can fit. The min font size is 14.
 * @param {Array} channelData
 * @param {Int} divWidth
 * @returns {Int}
 */
ChannelNamesOverlayUtils.prototype.getFontSize = function (channelData, divWidth) {
    var constants = window.OSDViewer.constants.CHANNEL_NAMES_OVERLAY_CONFIG,
        utils = window.OSDViewer.utils;

    var font = constants.MAX_FONT;
    var maxLines = constants.MAX_LINES;

    var usableArea = constants.USABLE_AREA * divWidth;

    while (font > 14) {
        // min font value would be 14

        var curWidth = 0;
        var curLine = 0
        var i;

        for (i = 0; i < channelData.length && curLine < maxLines; i++) {
            // add each channel name
            curWidth += utils.getTextWidth(channelData[i][0], font) + 40
            if (i + 1 < channelData.length && curWidth + utils.getTextWidth(channelData[i + 1][0], font) + 40 >= usableArea) {
                // if the next name wont fit in the current line, add a new line
                curWidth = 0
                curLine += 1
            }
        }

        if (i == channelData.length) {
            // if all the data fit, then return the current font
            return font;
        }

        // reduce the font size by 1, as the channel data did not fit
        font -= 2;
    }

    return Math.max(constants.MIN_FONT, font);
}

/**
 * This function writes the channels names in a single line
 * @param {canvas context} ctx
 * @param {Array} channelData
 * @param {Int} line - the line is which the data is added
 * @param {Int} canvasWidth
 * @param {boolean} hasMore - has more data
 */
ChannelNamesOverlayUtils.prototype.addChannelLineToCanvas = function (ctx, channelData, line, canvasWidth, hasMore) {
    var constants = window.OSDViewer.constants.CHANNEL_NAMES_OVERLAY_CONFIG

    hasMore = hasMore ? hasMore : false;
    // Find width of all the text
    var lineWidth = 0
    for (let i = 0; i < channelData.length; i++) {
        lineWidth += ctx.measureText(channelData[i][0]).width + 20;
    }
    if (line == constants.MAX_LINES - 1 && hasMore) {
        lineWidth += ctx.measureText('...').width
    } else {
        lineWidth -= 20;
    }

    // set the black background
    ctx.fillStyle = 'black';
    var leftMargin = (canvasWidth - lineWidth) / 2;
    var x = leftMargin - 10, bgWidth = lineWidth + 20, y = (50 - 30 + (50 * line)), bgHeight = 45;
    ctx.fillRect(x, y, bgWidth, bgHeight);

    // write the text
    var lineWidth = 0
    for (let i = 0; i < channelData.length; i++) {
        ctx.fillStyle = channelData[i][1];
        ctx.fillText(channelData[i][0], leftMargin + lineWidth, 50 + 50 * line);
        lineWidth += ctx.measureText(channelData[i][0]).width + 20;
    }

    // if more data is left, and no more line would be added, add ... to indicate that in the screenshot
    if (line == constants.MAX_LINES - 1 && hasMore) {
        ctx.fillStyle = 'white';
        ctx.fillText('...', leftMargin + lineWidth, 50 + 50 * line);
    }
}
