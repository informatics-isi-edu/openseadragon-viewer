function Utils(){};


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

Utils.prototype.addWaterMark2Canvas = function (canvas, watermark, scalebar) {
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
                        parameters.svgs = parameters.svgs || [];
                        parameters.svgs.push(value);
                    }
                    else if(value.indexOf("ImageProperties.xml") != -1){
                        parameters.images = parameters.images || [];
                        parameters.images.push(value);
                        parameters.type = 'dzi';
                    }
                    else if(value.indexOf("info.json") != -1) {
                        parameters.images = parameters.images || [];
                        parameters.images.push(value);
                        parameters.type = 'iiif';
                    } else if (value.length > 0 && value !== EMPTY) {
                        parameters.images = parameters.images || [];
                        parameters.images.push(value);
                        parameters.type = 'rest';
                    }
                });
                break;
            // array of string
            case "aliasName":
            case "channelName":
                paramValue.forEach(function (value) {
                    if( (value[0] == "\"" && value[value.length-1] == "\"") || (value[0] == "\'" && value[str.length-1] == "\'")){
                        value = value.substr(1,value.length-2);
                    }
                    if(!parameters[paramKey]){
                        parameters[paramKey] = [];
                    }
                    parameters[paramKey].push(value.length > 0 && value !== EMPTY ? decodeURI(value) : null);
                });
                break;
            // array of boolean
            case "isRGB":
                paramValue.forEach(function (value) {
                    value = value.toLocaleLowerCase();
                    if (["true", "false"].indexOf(value) != -1) {
                        value = (value === "true");
                    } else {
                        value = null;
                    }
                    if(!parameters[paramKey]){
                        parameters[paramKey] = [];
                    }
                    parameters[paramKey].push(value);
                });
                break;
            // array of color
            case "pseudoColor":
                paramValue.forEach(function (value) {
                    value = self.colorHexToRGB(decodeURI(value));
                    if(!parameters[paramKey]){
                        parameters[paramKey] = [];
                    }
                    parameters[paramKey].push(value);
                });
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

// Set the config based on the image type
Utils.prototype.setOsdConfig =  function(parameters, configs) {
  var config = null;
  switch (parameters.type) {
    case "iiif":
      config = configs.iiif;
      break;
    case "dzi":
      config = configs.rest;
      break;
    case "rest":
      config = configs.rest;
      break;
    default:
      break;

  }
  return config;
}

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
