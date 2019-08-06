function Viewer(parent, config) {

    var _self = this;

    this._utils = null;
    this._config = config;

    this.parent = parent;
    this.channels = {};
    this.current = {
        svgID : "",
        groupID : ""
    };
    this.isInitLoad = false;
    this.osd = null;
    this.tooltipElem = null;
    this.svg = null;
    this.svgCollection = {};

    // Init 
    this.init = function (utils) {

        if (!OpenSeadragon || !utils) {
            return null;
        }
        this._utils = utils;

        // Add each image source into Openseadragon viewer
        this.parameters = this._utils.getParameters();

        // Get config from scalebar and Openseadragon
        this.osd = OpenSeadragon(this._config.osd);
        this.osd.scalebar(this._config.scalebar);

        // Add a SVG container to contain svg objects
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("id", this._config.svg.id);
        this.osd.canvas.append(this.svg);

        // Parse urls to load image and channels
        this.loadImages(this.parameters.images);

        // Since 'open' event is no longer called properly, load initial position in 'animation-finish' event
        this.osd.addHandler('animation-finish', function (target) {
            // Only execute it once when Openseadragon is done loading
            if (!_self.isInitLoad) {
                // Check if need to pan to a specific location (if x, y, z are not null)
                if (_self.parameters.x && _self.parameters.y && _self.parameters.z) {
                    _self.panTo(_self.parameters.x, _self.parameters.y, _self.parameters.x, _self.parameters.z);
                }

                // Check if annotation svg exists
                if(_self.parameters.svgs) {
                    _self.importAnnotationUnformattedSVG(_self.parameters.svgs);
                    _self.resizeSVG();
                }
                
                _self.isInitLoad = true;  
            };
        });
  
        this.osd.addHandler('resize', this.resizeSVG);

        this.osd.addHandler('animation', this.resizeSVG);

        this.osd.addHandler('canvas-double-click', this.zoomIn.bind(this));

        this.osd.world.addHandler('add-item', function() {
            if(Object.keys(_self.channels).length == _self.osd.world.getItemCount()){
                for(var key in _self.channels){
                    var channel = _self.channels[key];
                    _self.setItemChannel({
                        id : channel.id
                    })
                }
            }
        });
    };

    // Build a tilesource object for Openseadragon Config
    this.buildTileSource = function (xmlDoc, imgPath) {

        var tileSource = {};
        tileSource.height = parseInt(xmlDoc.getAttribute("height"));
        tileSource.width = parseInt(xmlDoc.getAttribute("width"));
        tileSource.tileWidth = parseInt(xmlDoc.getAttribute("tileWidth"));
        tileSource.tileHeight = parseInt(xmlDoc.getAttribute("tileHeight"));
        tileSource.levelscale = parseInt(xmlDoc.getAttribute("levelScale"));
        tileSource.minLevel = parseInt(xmlDoc.getAttribute("minLevel"));
        tileSource.maxLevel = parseInt(xmlDoc.getAttribute("maxLevel"));
        tileSource.overlap = parseInt(xmlDoc.getAttribute("overlap")) || 0;
        tileSource.channelName = xmlDoc.getAttribute("channelName");
        tileSource.channelAlpha = +xmlDoc.getAttribute("channelDefaultAlpha");
        tileSource.channelRGB = xmlDoc.getAttribute("channelDefaultRGB");
        tileSource.dir = xmlDoc.getAttribute("data");
        tileSource.format = xmlDoc.getAttribute("format") || "jpg";
        tileSource.meterScaleInPixels = parseFloat(xmlDoc.getAttribute("meterScaleInPixels"));
        tileSource.minValue = parseFloat(xmlDoc.getAttribute("minValue")) || 0.0;
        tileSource.maxValue = parseFloat(xmlDoc.getAttribute("maxValue")) || 0.0;
        tileSource.imgPath = imgPath;
        tileSource.getLevelScale = function (level) {
            var levelScaleCache = {}, i;
            for (i = 0; i <= tileSource.maxLevel; i++) {
                levelScaleCache[i] = 1 / Math.pow(tileSource.levelscale, tileSource.maxLevel - i);
            }
            tileSource.getLevelScale = function (_level) {
                return levelScaleCache[_level];
            };
            return tileSource.getLevelScale(level);
        };
        tileSource.getTileUrl = function (level, x, y) {
            var t = tileSource.imgPath + "/" + (level) + "/" + x + "_" + y + "." + tileSource.format;
            return t;
        };
        return tileSource;
    }

    // Set current selecting annotation
    this.changeSelectingAnnotation = function (data) {

        if(this.current.svgID == data.svgID && this.current.groupID == data.groupID){
            this.current.svgID = "";
            this.current.groupID = "";
        }
        else if(this.svgCollection.hasOwnProperty(data.svgID)){
            if(data.x1 && data.x2 && data.y1 && data.y2){
                this.zoomInRectViewport(data)
            }
            this.current.svgID = data.svgID;
            this.current.groupID = data.groupID;
        }
    }

    // Change all SVGs annotations visibility
    this.changeAllAnnotationVisibility = function(isDisplay){
        for(var svgID in this.svgCollection){
            this.svgCollection[svgID].changeAllVisibility(isDisplay);
        }
    }

    // Handle events from children/ Dispatch events to toolbar
    this.dispatchEvent = function (type, data) {

        switch (type) {
            /**
             * [Handle events from children]
             */
            // Show group tooltip when mouse over
            case "onMouseoverShowTooltip":
                this.onMouseoverShowTooltip(data);
                break;
            // Adjust tooltip location when mouse move
            case "onMousemoveShowTooltip":
                this.onMousemoveShowTooltip(data);
                break;
            // Remove tooltip and border when mouse out of the svg
            case "onMouseoutHideTooltip":
                this.onMouseoutHideTooltip();
                break;
            /**
             * [Dispatch events to App]
             */
            // Change current selected annotation group from toolbar
            case "onClickChangeSelectingAnnotation":
                this.changeSelectingAnnotation(data);
                this.parent.dispatchEvent(type, {
                    svgID : data.svgID,
                    groupID : data.groupID
                });
                break;
            default:
                this.parent.dispatchEvent(type, data);
                break;
        }
    }

    // Dispatch events to SVG objects
    this.dispatchSVGEvent = function(type, data){

        if(!this.svgCollection.hasOwnProperty(data.svgID)){
            return 
        };

        var svg = this.svgCollection[data.svgID];

        switch(type){
            // Change an annotation group's visibility
            case "changeAnnotationVisibility":
                svg.changeVisibility(data);
                break;
            // Change current selected annotation group
            case "highlightAnnotation":
                svg.changeSelectedGroup(data);
                this.changeSelectingAnnotation(data);
                break;
            // Change all annotation groups visibility
            case "changeAllVisibility":
                svg.changeAllVisibility(data.isDisplay);
                break;
            // Set annotation groups attributes
            case "setGroupAttributes":
                svg.setGroupAttributes(data);
                break;
            default:
                break;
        }
    }

    // Exporting the Openseadragon view to a jpg file
    this.exportViewToJPG = function (fileName) {
        fileName = (fileName) ? fileName + ".jpg" : "osd_" + Date.parse(new Date()) + ".jpg";

        var isScalebarExist = (this.osd.scalebarInstance.pixelsPerMeter !== 0) ? true : false,
            canvas,
            newCanvas,
            newCtx,
            rawImg,
            pixelDensityRatio;

        if (isScalebarExist) {
            canvas = this.osd.scalebarInstance.getImageWithScalebarAsCanvas();
            canvas = this._utils.addWaterMark2Canvas(canvas, this.parameters.waterMark, this.osd.scalebarInstance);
            rawImg = canvas.toDataURL("image/jpeg", 1);
        }
        else {
            canvas = this.osd.drawer.canvas;
            pixelDensityRatio = this.osd.scalebarInstance.queryForRetina(canvas);
            if (pixelDensityRatio != 1) {
                newCanvas = document.createElement("canvas");
                newCanvas.width = canvas.width;
                newCanvas.height = canvas.height;
                newCtx = newCanvas.getContext("2d");
                newCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                newCanvas = this._utils.addWaterMark2Canvas(newCanvas, this.parameters.waterMark);
                rawImg = newCanvas.toDataURL("image/jpeg", 1);
            } else {
                canvas = this._utils.addWaterMark2Canvas(canvas, this.parameters.waterMark);
                rawImg = canvas.toDataURL("image/jpeg", 1);
            }
        }

        if (rawImg) {
            this._utils.downloadAsFile(fileName, rawImg, "image/jpeg");
        }
    }

    // Get channels
    this.getChannels = function () {
        return this.channels;
    }

    // Load and import the unstructured SVG file into Openseadragon viewer
    this.importAnnotationUnformattedSVG = function (svgs) {

        for(var i = 0; i < svgs.length; i++){
            var id = Date.parse(new Date()) + parseInt(Math.random() * 1000),
                svgFileLocation = svgs[i],
                content = this._utils.getUrlContent(svgFileLocation),
                svgParser = new DOMParser(),
                svgFile = svgParser.parseFromString(content, "image/svg+xml"),
                svgFile = svgFile.getElementsByTagName("svg")[0];

            this.svgCollection[id] = new AnnotationSVG(id, this);
            this.svgCollection[id].parseSVGFile(svgFile);
        }
    }

    // Load Image and Channel information
    this.loadImages = function (urls) {

        var urls = urls || [],
            channelList = [],
            i;

        for (i = 0; i < urls.length; i++) {

            var isImageSimpleBase = urls[i].indexOf('ImageProperties.xml') == -1 ? true : false,
                channel,
                url = urls[i],
                option = {},
                meterScaleInPixels = null;

            if (isImageSimpleBase) {

                option = {
                    tileSource: {
                        channelName : this.parameters.channelName,
                        tileWidth: 457,
                        tileHeight: 640,
                        type: 'image',
                        url: url
                    },
                    compositeOperation: 'lighter'
                };
            }
            else {

                var xmlString = this._utils.getUrlContent(url),
                    imgPath = url.replace('/ImageProperties.xml', ''),
                    xmlParser = new DOMParser(),
                    xmlDoc = xmlParser.parseFromString(xmlString.trim(), "application/xml");

                xmlDoc = xmlDoc.getElementsByTagName("IMAGE_PROPERTIES")[0],
                option.tileSource = this.buildTileSource(xmlDoc, imgPath);
            }

            channel = new Channel(i, option.tileSource);

            meterScaleInPixels = option.tileSource.meterScaleInPixels ? option.tileSource.meterScaleInPixels : meterScaleInPixels;
            meterScaleInPixels = this.parameters.meterScaleInPixels ? this.parameters.meterScaleInPixels : meterScaleInPixels;
            this.resetScalebar(meterScaleInPixels);
            this.osd.addTiledImage(option);

            this.channels[i] = channel;
            channelList.push({
                name: channel.name,
                contrast: channel["contrast"],
                brightness: channel["brightness"],
                gamma: channel["gamma"],
                hue : channel["hue"],
                osdItemId: channel["id"]
            });
        }

        // Dispatch event to toolbar to update channel list
        this.dispatchEvent('updateChannelList', channelList);
    }

    // Show tooltip when mouse over the annotation on Openseadragon viewer 
    this.onMouseoverShowTooltip = function(data){

        if(document.querySelector("#annotationTooltip") == null){
            var tooltipElem = [
                "<div id='annotationTooltip'>",
                    "<span class='row' data-type='anatomy'>",
                        "<span class='name'> Anatomy : </span>",
                        "<span class='desc'>"+data.anatomy+"</span>",
                    "</span>",
                "</div>"
            ].join("");
            document.querySelector("#" + this._config.osd.id).insertAdjacentHTML('beforeend', tooltipElem);
            this.tooltipElem = d3.select("div#annotationTooltip");
        }
         
        this.tooltipElem
            .style("display", "flex")
            .transition()
            .duration(500)
            .style("opacity", 0.9)
            .style("left", (data.x + 20) + "px")		
            .style("top", (data.y + 20) + "px");	
    }

    // Move annotation tooltip when mouse move on Openseadragon viewer 
    this.onMousemoveShowTooltip = function(data){
        this.tooltipElem
            .style("left", (data.x + 20) + "px")		
            .style("top", (data.y + 20) + "px");	
    }

    // Hide annotation tooltip when mouse out of the annotation on Openseadragon viewer 
    this.onMouseoutHideTooltip = function(){

        this.tooltipElem
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
    }

    // Pan to specific location
    this.panTo = function (x, y, z) {
        var centerPoint = new OpenSeadragon.Point(x, y);
        _self.osd.viewport.panTo(centerPoint, 'true');

        if (z != null) {
            _self.osd.viewport.zoomTo(_self.parameters.z);
        }

        _self.osd.viewport.applyConstraints();
    }
   
    // Render annotation tooltip when user's mouse hover the annotation
    this.renderAnnotationTooltip = function () {
        var tooltipElem = "";
        var container = document.getElementById("container");

        if (this.tooltipElem == null) {

            tooltipElem = [
                "<div id='annotationTooltip'>",
                "<span class='row anatomy' data-type='anatomy'></span>",
                "<span class='row description' data-type='description'></span>",
                "</div>"
            ].join("");

            container.insertAdjacentHTML('beforeend', tooltipElem);

            this.tooltipElem = d3.select("#annotationTooltip");
        }
    }

    // Remove overlay
    this.removeOverlay = function (element) {
        this.osd.removeOverlay(element);
    }

    // Reset the scalebar measurement (pixel per meter) with new value
    this.resetScalebar = function (value) {
        this.osd.scalebar({
            location: OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT,
            pixelsPerMeter: value
        });
    }

    // Reset Openseadragon to home view
    this.resetHomeView = function () {
        this.osd.viewport.goHome();
        this.osd.viewport.applyConstraints();
    }

    // Resize Annotation SVGs
    this.resizeSVG = function(){
        var svgs = _self.svg.querySelectorAll(".annotationSVG"),
            p1,
            p2,
            i;

        for(i = 0; i < svgs.length; i++){
            p1 = svgs[i].getAttribute("p1").split(",") || [];
            p2 = svgs[i].getAttribute("p2").split(",") || [];
            if(p1.length == 0 || p2.length == 0){
                continue;
            }
            p1 = _self.osd.viewport.pixelFromPoint(new OpenSeadragon.Point(+p1[0], +p1[1]), true);
            p2 = _self.osd.viewport.pixelFromPoint(new OpenSeadragon.Point(+p2[0], +p2[1]), true);
            svgs[i].setAttribute("x", p1.x + "px");
            svgs[i].setAttribute("y", p1.y + "px");
            svgs[i].setAttribute("width", p2.x - p1.x + "px");
            svgs[i].setAttribute("height", p2.y - p1.y + "px");
        }
    }

    // Set Openseadragon viewer item visibility
    this.setItemVisibility = function (id, isDisplay) {
        var item = this.osd.world.getItemAt(id),
            opacity = (isDisplay) ? 1 : 0;
        item.setOpacity(opacity);
        this.channels[id].opacity = opacity;
    }

    // Set Openseadragon viewer item channel values
    this.setItemChannel = function (data) {

        var channel = this.channels[data.id],
            item = this.osd.world.getItemAt(data.id);

        if (!channel || !item) { return; }

        channel.set(data.type, data.value);

        this.osd.setFilterOptions({
            filters: [
                {
                    items: [item],
                    processors: channel.getFiltersList()
                }
            ]
        })
    }

    // Zoom in to the given rectangle viewport 
    this.zoomInRectViewport = function(data){
        if(data == null){ return }

        // Add 20% padding to each side
        var x1 = data.x1 * 0.980,
            y1 = data.y1 * 0.980,
            x2 = data.x2 * 1.020,
            y2 = data.y2 * 1.020;

        // Adjust Openseadragon viewer bounds to fit the group svg
        this.osd.viewport.fitBounds(new OpenSeadragon.Rect(x1, y1, x2 - x1, y2 - y1));
    }

    // Zoom in 
    this.zoomIn = function () {
        this.osd.viewport.zoomBy(2 / 1.0);
        this.osd.viewport.applyConstraints();
    }

    // Zoom out 
    this.zoomOut = function () {
        this.osd.viewport.zoomBy(1.0 / 2);
        this.osd.viewport.applyConstraints();
    }
}














