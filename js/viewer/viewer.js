function Viewer() {

    var _self = this;

    this._utils = null;
    this._config = null;
    this._toolbarController = null;

    this.channels = {};
    this.annotationCollection = {};
    this.currentMouseTracker = null;
    this.currentAnnotationId = "";
    this.isInitLoad = false;
    this.mouseTrackerDestroyTimeout = 300;
    this.overlayVisibility = true;
    this.osd = null;
    this.tooltipElem = null;

    // Init 
    this.init = function (utils, config, toolbarController) {

        if (!OpenSeadragon || !utils || !config) {
            return null;
        }
        this._utils = utils;
        this._config = config;
        this._toolbarController = toolbarController;

        // Get config from scalebar and Openseadragon
        this.scalebarSetting = this.getConfig('scalebar');
        this.osdSetting = this.getConfig('osd');
        this.osd = OpenSeadragon(this.osdSetting);
        this.osd.scalebar(this.scalebarSetting);
        this.osd.svgOverlay();

        // Customized SVG container
        // var container = document.createElement("div")
        // container.innerHTML = [
        //     '<div id="annotationContainer" style="position: absolute; top:0; left:0; width: 100%; height: 100% "></div>'
        // ].join("");
        // document.querySelector(".openseadragon-canvas").append(container);

        // Add each image source into Openseadragon viewer
        this.parameters = this._utils.getParameters();

        // Parse urls to load image and channels
        this.loadImages(this.parameters.images);

        // Show annotation list in default
        _self._toolbarController.onClickedMenuHandler('annotationList');

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
                }
                
                _self.isInitLoad = true;                
            };

        });
  
        // this.osd.addHandler('resize', function() {
        //     var svg = (svg) ? svg : document.getElementById("annotation1");
        //     if(svg){
        //         var p1 = svg.getAttribute("p1").split(",");
        //         var p2 = svg.getAttribute("p2").split(",");
        //         var p1 = _self.osd.viewport.pixelFromPoint(new OpenSeadragon.Point(+p1[0], +p1[1]), true);
        //         var p2 = _self.osd.viewport.pixelFromPoint(new OpenSeadragon.Point(+p2[0], +p2[1]), true);
        //         svg.style.left = p1.x + "px";
        //         svg.style.top = p1.y + "px";
        //         svg.style.width = p2.x - p1.x + "px";
        //     }
        // });

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

    // Add the created annotation object to the collection
    this.addAnnotation = function (annotation) {
        var annotationId = annotation._attrs["annotation-id"];

        // Check if annotation group id has already existed and create one if not
        if (!this.annotationCollection.hasOwnProperty(annotationId)) {
            this.createAnnotationGroup(annotationId);
        }

        this.annotationCollection[annotationId].add(annotation);
    }

    // Add overlay 
    this.addOverlay = function (elem, location) {
        this.osd.addOverlay(elem, location);
        return this.osd.currentOverlays[this.osd.currentOverlays.length - 1];
    }

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

    // Change overlay visibility (all annotations)
    this.changeOverlayVisibility = function (visibility) {
        var annotationId,
            annotationGroup;

        this.overlayVisibility = visibility;

        for (annotationId in this.annotationCollection) {
            annotationGroup = this.annotationCollection[annotationId];
            annotationGroup.setDisplay(visibility);
            // annotationGroup.locateFlag(visibility);
        }
    }

    // Set current selecting annotation
    this.changeSelectingAnnotation = function (data) {
        if(this.annotationCollection.hasOwnProperty(this.currentAnnotationId)){
            var group = this.annotationCollection[this.currentAnnotationId];
            group.isSelected = false;
            group.unHighlightAll();
        }

        if(this.annotationCollection.hasOwnProperty(data.id)){
            var group = this.annotationCollection[data.id],
                x1 = group.x1 * 0.990,
                y1 = group.y1 * 0.990,
                x2 = group.x2 * 1.010,
                y2 = group.y2 * 1.010;

            
            // Bring up the element to the front
            this.osd.svgOverlay().node().append(group.svg.node());

            // Adjust Openseadragon viewer bounds to fit the group svg
            this.osd.viewport.fitBounds(new OpenSeadragon.Rect(x1, y1, x2 - x1, y2 - y1));

            group.highlightAll();
            group.isSelected = true;
        }

        this.currentAnnotationId = data.id;
    }

    // Change the annotation group visibility
    this.changeAnnotationVisibility = function (data) {
        var annotationGroup = this.getAnnotationGroupById(data.id);
        annotationGroup.setDisplay(data.isDisplay);
    }

    // Create drawing area for grouping annotations with same id
    this.createAnnotationGroup = function (id, description, anatomy) {
        // Check if the area has created
        id = id ? id : Date.parse(new Date());
        var isGroupEmpty = this.annotationCollection.hasOwnProperty(id) ? false : true;
        var group = null;

        // Check if annotation id has already existed and create one if not
        if (isGroupEmpty) {
            group = new AnnotationGroup(id, description, anatomy, this);
            group.render();

            this.annotationCollection[id] = group
            this.dispatchEvent('UpdateAnnotationList', [group]);

            return group;
        }
    }

    // Create a new line/rect/circle object for the user to draw
    this.createAnnotationObject = function (type) {
        var group = null,
            annotation = null;

        // Create a new group if none exists
        group = (this.currentAnnotationId == "") ? this.createAnnotationGroup() : this.getAnnotationGroupById(this.currentAnnotationId);

        // Set the current annotation id
        this.currentAnnotationId = group.id;

        // Create an annotation
        annotation = group.addAnnotation(type);

        // Start to draw
        annotation.setAttributesByJSON({ 
            "stroke" : "#000",
            "stroke-width" : this.getStrokeWidth()
        })
        annotation.draw();
    }

    // Create a new mousetracker for creating new annotation object
    this.createMouseTracker = function (element, userData) {

        var isCreatingAnnotation = this.currentMouseTracker != null ? true : false;
        // destroy the existing mousetracker before creating a new mousetracker
        if (isCreatingAnnotation) {
            this.destoryMouseTracker();
            setTimeout(function () {
                this.currentMouseTracker = new OpenSeadragon.MouseTracker({
                    element: element,
                    dragHandler: this.mouseDragHandler,
                    dragEndHandler: this.mouseDragEndHandler,
                    userData: userData
                });
            }.bind(this), this.mouseTrackerDestroyTimeout);
        }
        // creating a new mousetracker
        else {
            this.currentMouseTracker = new OpenSeadragon.MouseTracker({
                element: element,
                dragHandler: this.mouseDragHandler,
                dragEndHandler: this.mouseDragEndHandler,
                userData: userData
            });
        }
    };

    // Destroy the mousetracker created when user done creating the annotation object
    this.destoryMouseTracker = function () {
        setTimeout(function () {
            if (this.currentMouseTracker != null) {
                this.currentMouseTracker.destroy();
                this.currentMouseTracker = null;
            }
        }.bind(this), this.mouseTrackerDestroyTimeout)
    }

    // Handle events from children/ Dispatch events to toolbar
    this.dispatchEvent = function (type, data) {

        switch (type) {
            /**
             * [Handle events from children]
             */
            // Drawing annotation object
            case "DrawAnnotation":
                var drawArea = this.getSVGOverlayContainer();
                this.createMouseTracker(drawArea, {
                    annotation: data,
                })
                break;
            // Show tooltip when mouse over the annotation svg
            case "OnMouseoverShowTooltip":
                this.highlightAnnotationBorder(data.x1, data.y1, data.x2, data.y2);
                this.onMouseoverShowTooltip(data);
                break;
            // Adjust tooltip location when mouse move
            case "OnMousemoveShowTooltip":
                this.onMousemoveShowTooltip(data);
                break;
            // Remove tooltip and border when mouse out of the svg
            case "OnMouseoutHideTooltip":
                this.onMouseoutHideTooltip();
                this.hideAnnotationBorder();
                break;
            /**
             * [Dispatch events to Toolbar controller]
             */
            // Change the selecting annotation 
            case "OnClickChangeSelectingAnnotation":
                this.changeSelectingAnnotation(data);
                this._toolbarController.changeSelectingAnnotation(data, false);
                break;
            // Update the annotation list with data
            case "UpdateAnnotationList":
                this._toolbarController.updateAnnotationList(data);
                break;
            // Update the channel list with data
            case "UpdateChannelList":
                this._toolbarController.updateChannelList(data);
                break;
        }

    }

    // [To Fix] Exporting the annotation collection into SVG file
    this.exportAnnotationsToSVG = function () {

        var transformAttr = this.osd.svgOverlay()._node.getAttribute("transform"),
            annotationId,
            annotationGroup,
            annotationContent = "",
            blob = null,
            dataUrl,
            svgContent = "",
            rotation = this.osd.viewport.getRotation(),
            scale = this.osd.viewport._containerInnerSize.x * 1;

        if (this.annotationCollection) {
            console.log("No annotations to export to SVG currently");
            return;
        }

        for (annotationId in this.annotationCollection) {
            annotationGroup = this.annotationCollection[annotationId];
            annotationContent += annotationGroup.toSVG();
        }

        svgContent += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
        svgContent += '<g transform="translate(10,10) scale(' + scale + ') rotate(' + rotation + ')">'
        svgContent += annotationContent;
        svgContent += '</g></svg>';

        blob = new Blob([svgContent], { type: "image/svg+xml" });
        dataUrl = window.URL.createObjectURL(blob)
        this._utils.downloadAsFile("Annotations", dataUrl);
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

    // Get groups from annotation collection
    this.getAnnotationItems = function () {
        return this.annotationCollection;
    }

    // Get channels
    this.getChannels = function () {
        return this.channels;
    }

    // Get annotation group by annotation-id
    this.getAnnotationGroupById = function (id) {
        return this.annotationCollection[id] || null;
    }

    // Get stroke width 
    this.getStrokeWidth = function () {
        var p1 = this.osd.viewport.pointFromPixel(new OpenSeadragon.Point(0, 0)),
            p2 = this.osd.viewport.pointFromPixel(new OpenSeadragon.Point(1, 1)),
            strokeWidth = p2.x - p1.x;

        return strokeWidth;
    }
    // Get the overlay visibility (all annotations)
    this.getOverlayVisibility = function () {
        return this.overlayVisibility;
    }

    // Get config for openseadragon/scalebar
    this.getConfig = function (type) {
        switch (type.toUpperCase()) {
            case "OSD":
                return this._config.osd;
            case "SCALEBAR":
                return this._config.scalebar;
        }
    }

    // Get the SVG Overlay container area
    this.getSVGOverlayContainer = function (type) {
        return this.osd.svgOverlay().node().parentNode;
    }

    // Get the conversion of coordinates
    this.getRatioPerPixel = function (w, h, p1, p2) {

        var xUnit = Math.abs(p2.x - p1.x) / w;
        var yUnit = Math.abs(p2.y - p1.y) / h;

        return {
            x: xUnit,
            y: yUnit
        }
    };

    // Highlight border of annotation group
    this.highlightAnnotationBorder = function (x1, y1, x2, y2) {

        var strokeWidth = _self.getStrokeWidth() * 2,
            w = x2 - x1,
            h = y2 - y1;

        d3.select(this.osd.svgOverlay().node())
            .append("rect")
            .attr("class", "groupBorder")
            .attr("x", x1)
            .attr("y", y1)
            .attr("width", w)
            .attr("height", h)
            .attr("fill", "none")
            .attr("stroke-width", strokeWidth)
            .attr("stroke", "yellow")
    }

    // Hide border of annotation group
    this.hideAnnotationBorder = function (x, y, w, h) {
        d3.selectAll("rect.groupBorder")
            .remove();
    }

    // // Load and import the unstructured SVG file into Openseadragon viewer
    this.importAnnotationUnformattedSVG = function (svgs) {

        for(var i = 0; i < svgs.length; i++){
            var svgFileLocation = svgs[i],
                content = this._utils.getUrlContent(svgFileLocation),
                svgParser = new DOMParser(),
                svgFile = svgParser.parseFromString(content, "image/svg+xml"),
                svgFile = svgFile.getElementsByTagName("svg")[0],
                // SVG file width and height by pixel
                svgWidth = +svgFile.getAttribute("viewBox").split(" ")[2],
                svgHeight = +svgFile.getAttribute("viewBox").split(" ")[3],
                svgStyleSheet = {},
                styleSheet = {},
                styleTags,
                // Diagonal points correspond to image coordinates
                diagnonalPoint1 = svgFile.getAttribute("p1").split(","),
                diagnonalPoint2 = svgFile.getAttribute("p2").split(","),
                // Convert diagonal points to Openseadragon Points
                osdStartPoint = new OpenSeadragon.Point(+diagnonalPoint1[0], +diagnonalPoint1[1]),
                osdEndPoint = new OpenSeadragon.Point(+diagnonalPoint2[0], +diagnonalPoint2[1]),
                // Convert the ratio per pixel in Openseadragon coordinates
                ratioPerPixel = this.getRatioPerPixel(svgWidth, svgHeight, osdStartPoint, osdEndPoint);

            // Adjust Openseadragon viewer bounds to fit the loaded SVG
            this.osd.viewport.fitBounds(new OpenSeadragon.Rect(osdStartPoint.x, osdStartPoint.y, osdEndPoint.x - osdStartPoint.x, osdEndPoint.y - osdStartPoint.y));

            // Add SVG stylesheet to the document to get the css rules
            document.getElementsByTagName("head")[0].append(svgFile.getElementsByTagName("style")[0])

            // Get the SVG stylesheet rules and remove the style tag from document
            svgStyleSheet = document.styleSheets[document.styleSheets.length - 1].cssRules;
            styleTags = document.getElementsByTagName("style");
            styleTags[styleTags.length - 1].remove()

            // Parsing the css class rules
            for (var j = 0; j < svgStyleSheet.length; j++) {
                var className = svgStyleSheet[j].selectorText.replace(".", ""),
                    index = 0,
                    attr,
                    value;

                styleSheet[className] = {};
                while (svgStyleSheet[j].style[index]) {
                    attr = svgStyleSheet[j].style[index];
                    value = svgStyleSheet[j].style[attr];
                    styleSheet[className][attr] = value;
                    index += 1;
                }
            }
            // Parsing child nodes in SVG
            this.parseSvgChildNodes(svgFile, osdStartPoint, ratioPerPixel, styleSheet);
        }
        
        // Setting each group's boundary
        for (var id in this.annotationCollection) {
            var annotation = this.annotationCollection[id];
            annotation.updateDiagonalPoints();
            // annotation.updateIndicatorLocation();
        } 
    }

    // Load and import the structured SVG file into Openseadragon viewer
    this.importAnnotationSVG = function () {

        var svgFileLocation = "data/Q-296R-test.svg",
            content = this._utils.getUrlContent(svgFileLocation),
            svgParser = new DOMParser(),
            svgFile = svgParser.parseFromString(content, "image/svg+xml"),
            annotationGroups = svgFile.getElementsByTagName("g"),
            annotation = null,
            annotationId = null,
            annotationDesc = "",
            annotationAnatomy = "",
            tag,
            tagName,
            i,
            j;

        for (i = 0; i < annotationGroups.length; i++) {
            annotationId = annotationGroups[i].getAttribute("annotation-id");
            annotationDesc = annotationGroups[i].getAttribute("description");
            annotationAnatomy = annotationGroups[i].getAttribute("anatomy");
            if (!annotationId) { continue; }

            this.createAnnotationGroup(annotationId, annotationDesc, annotationAnatomy);

            for (j = 0; j < annotationGroups[i].children.length; j++) {
                tag = annotationGroups[i].children[j];
                tagName = tag.tagName;

                switch (tagName.toUpperCase()) {
                    case "PATH":
                        annotation = new Scribble();
                        break;
                    case "CIRCLE":
                        annotation = new Circle();
                        break;
                    case "RECT":
                        annotation = new Rect();
                        break;
                }
                annotation.setAttributesBySVG(tag);
                annotation.renderSVG(this);
                this.addAnnotation(annotation);
            }
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
        this.dispatchEvent('UpdateChannelList', channelList);
    }

    // Locate annotation group by showing a flag on Openseadragon viewer
    // this.locateAnnotationFlag = function (data) {
    //     var annotationGroup = this.getAnnotationGroupById(data.id);
    //     annotationGroup.locateFlag(data.isLocate);
    // }

    

    // Drag event start handler 
    this.mouseDragHandler = function (event) {
        var annotation = event.userData.annotation;
        var normalizedPoint = _self.osd.viewport.pointFromPixel(event.position);
        annotation.drawStartHandler(normalizedPoint);
    }

    // Drag event stop handler 
    this.mouseDragEndHandler = function (event) {
        var annotation = event.userData.annotation;
        annotation.drawEndHandler();
        _self.destoryMouseTracker();
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
            document.querySelector("#" + this.osdSetting.id).insertAdjacentHTML('beforeend', tooltipElem);
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
    // Parsing SVG nodes into annotation groups
    this.parseSvgChildNodes = function (svg, startPoint, ratioPerPixel, styleSheet, group) {
        var svgElems = svg.childNodes || [],
            i,
            attrs,
            anatomy,
            annotation = null,
            annotationId = Date.parse(new Date()) + parseInt(Math.random() * 1000),
            className,
            data,
            node;

        // Create a new group if none exists
        group = (group) ? group : this.createAnnotationGroup(annotationId);

        for (i = 0; i < svgElems.length; i++) {

            if (!svgElems[i].getAttribute) { continue; }
            
            node = svgElems[i];
            className = node.getAttribute("class") || "";
            attrs = styleSheet[className] ? JSON.parse(JSON.stringify(styleSheet[className])) : {};

            switch (node.nodeName) {
                case "a":
                    this.parseSvgChildNodes(node, startPoint, ratioPerPixel, styleSheet, group);
                    break;
                case "g":
                    annotationId = Date.parse(new Date()) + parseInt(Math.random() * 1000),
                    anatomy = node.getAttribute("id");
                    this.parseSvgChildNodes(node, startPoint, ratioPerPixel, styleSheet, this.createAnnotationGroup(annotationId, "", anatomy));
                    break;
                case "path":
                    annotation = group.addAnnotation("SCRIBBLE")
                    data = annotation.convertPathPixelToPoints(startPoint, ratioPerPixel, node.getPathData());
                    node.setPathData(data);
                    attrs["d"] = node.getAttribute("d");
                    annotation.setAttributesByJSON(attrs);
                    annotation.renderSVG(this);
                    break;
                case "rect":
                    annotation = group.addAnnotation("RECT");
                    attrs["height"] = +node.getAttribute("height") ? (+node.getAttribute("height") * ratioPerPixel.y) : null;
                    attrs["width"] = +node.getAttribute("width") ? (+node.getAttribute("width") * ratioPerPixel.x) : null;
                    attrs["x"] = (+node.getAttribute("x")) ? +node.getAttribute("x") * ratioPerPixel.x : startPoint.x;
                    attrs["y"] = (+node.getAttribute("y")) ? +node.getAttribute("y") * ratioPerPixel.y : startPoint.y;
                    annotation.setAttributesByJSON(attrs);
                    annotation.renderSVG(this);
                    break;
            }
        }
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

    // Remove the annotation group from collection by annotation-id
    this.removeAnnotationById = function (id) {
        if (this.annotationCollection.hasOwnProperty(id)) {
            this.annotationCollection[id].remove();
            delete this.annotationCollection[id];

            if (this.currentAnnotationId == id) {
                this.currentAnnotationId = "";
            }
        };
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

    // Set Openseadragon viewer annotation attribute values
    this.setAnnotationAttributes = function (data) {

        var annotationGroup = this.getAnnotationGroupById(data.id);
        annotationGroup.setAttributesByJSON(data);
    }

    // Update overlay position
    // this.redrawViewerContent = function () {
    //     this.osd.forceRedraw();
    // }

    // Zoom in 
    this.zoomIn = function () {
        var zoomPerClick = this.osdSetting.zoomPerClick;
        this.osd.viewport.zoomBy(2 / 1.0);
        this.osd.viewport.applyConstraints();
    }

    // Zoom out 
    this.zoomOut = function () {
        var zoomPerClick = this.osdSetting.zoomPerClick;
        this.osd.viewport.zoomBy(1.0 / 2);
        this.osd.viewport.applyConstraints();
    }
}














