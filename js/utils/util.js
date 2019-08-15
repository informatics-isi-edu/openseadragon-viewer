function Utils(){};

// Add attribution watermark
Utils.prototype.addWaterMark2Canvas = function (canvas, watermark, scalebar) {
    if(!watermark || !canvas) return canvas;

    var fsize = 20,
        h = canvas.height,
        w = canvas.width,
        l = Math.floor(w / 20),
        ctx = canvas.getContext("2d"),
        sLoc;

    if (l < fsize){
        // cap it at 20
        fsize = l;
    }

    // if has scalebar, associate with it
    if (scalebar) { 
        sLoc = scalebar.getScalebarLocation()
        wx = sLoc.x + scalebar.divElt.offsetWidth - 10;
        fsize = scalebar.divElt.offsetWidth / 3;
    } else {
        wx = w - fsize;
    }
    ctx.save();
    ctx.translate(5, h - fsize / 3 - 5);
    ctx.textAlign = "left";
    ctx.font = fsize + "pt Sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(watermark, 0, 0);
    ctx.restore();
    return canvas;
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

// Parsing browser's url to get file locations
Utils.prototype.getParameters = function(){
    var args = document.location.href.split("?"),
        type,
        parameters = {};

    args = args[1] ? args[1].split("&") : [];
    for(var i = 0; i < args.length; i++){
        type = args[i].split("=")[0];
        value = args[i].split("=")[1];
        switch(type){
            case "url":
                if(value.indexOf(".svg") != -1){
                    parameters.svgs = parameters.svgs || [];
                    parameters.svgs.push(value); 
                }
                else if(value.indexOf("ImageProperties.xml") != -1){
                    parameters.images = parameters.images || [];
                    parameters.images.push(value); 
                }
                break;
            case "channelName":
            case "aliasName":
            case "waterMark":
                if( (value[0] == "\"" && value[value.length-1] == "\"") || (value[0] == "\'" && value[str.length-1] == "\'")){
                    value = value.substr(1,value.length-2);
                }  
                parameters[type] = decodeURI(value);
                break;
            case "meterScaleInPixels":
            case "x":
            case "y":
            case "z":
                value = parseFloat(value);
                if(!isNaN(value)){
                    parameters[type] = value;
                }
                break;
        }
    }
    // console.log(parameters);
    return parameters;
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