function Viewer(parent, config) {

    const modes = {
        "VIEW" : 'VIEW',
        "ERASE_ANNOTATIONS" : 'ERASE_ANNOTATIONS'
    }

    var _self = this;

    this._utils = null;
    this.config = config;

    this.parent = parent;
    this.channels = {};
    this.filters = {} // For filters of multiple channels.
    this.current = {
        svgID : "",
        groupID : ""
    };
    this.mouseTrackers = [];
    this.mode = modes.VIEW;
    this.isInitLoad = false;
    this.osd = null;
    this.tooltipElem = null;
    this.svg = null;
    this.svgCollection = {};
    this.scale = null;
    this.strokeScale = 1;
    this.strokeWidthScale = null;
    this.strokeMinScale = 1.5;
    this.strokeMaxScale = 3.5;
    this.svgNotPresent = false;
    this.stayInsideImage = true;

    this.svgFiles = {};

    // Init
    this.init = function (utils, params) {

        if (!OpenSeadragon || !utils) {
            return null;
        }
        this._utils = utils;

        // Add each image source into Openseadragon viewer
        if (!params.isProcessed) {
            this.parameters = this._utils.processParams(params);
        } else {
            this.parameters = params;
        }

        // configure osd
        this.osd = OpenSeadragon(this.config.osd);

        // show spinner while initializing the page
        this.resetSpinner(true);

        // add the scalebar (might change based on the images)
        this.osd.scalebar(this.config.scalebar);

        // load the images
        console.log('channels:', _self.parameters.channels);
        this.loadImages(this.parameters.mainImage);

        // Add a SVG container to contain annotations
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("id", this.config.annotation.id);
        this.osd.canvas.append(this.svg);


        if (this.config.osd.showHistogram) {
            this.histogramContainer = document.createElement("div");
            this.histogramContainer.setAttribute("id", "histogram-container");
            this.osd.canvas.append(this.histogramContainer);

            this.osd.initializeColorHistogram("histogram-container");
        }

        // after each resize, make sure svgs are properly positioned
        this.osd.addHandler('resize', this.resizeSVG);

        // after each change, make sure svgs are properly positioned
        this.osd.addHandler('animation', this.resizeSVG);

        // zoom on double click
        this.osd.addHandler('canvas-double-click', this.zoomIn.bind(this));

        // inform the client if any of the images failed to load
        this.osd.world.addHandler('add-item-failed', function(event) {
            console.error("Failed to add an item to osd", event);
            _self.resetSpinner();
            _self.dispatchEvent('mainImageLoadFailed', {});
        });

        // the finalizing tasks after images are load
        var zPlaneInitialized = false;
        this.osd.world.addHandler('add-item', function(event) {
            // we need the aspect ratio, so we have to wait for at least one image
            if (!zPlaneInitialized) {
                zPlaneInitialized = true;

                // if we're showing a multi-z view, we should start it
                if (_self.parameters.zPlaneTotalCount > 1) {
                    var imageSize = event.item.getContentSize()

                    _self.dispatchEvent('initializeZPlaneList', {
                        "totalCount": _self.parameters.zPlaneTotalCount,
                        "mainImageZIndex": _self.parameters.mainImage.zIndex,
                        "mainImageWidth": imageSize.x,
                        "mainImageHeight": imageSize.y,
                        "canUpdateDefaultZIndex": _self.parameters.mainImage.acls && _self.parameters.mainImage.acls.canUpdate
                    });
                }
            }

            // display a spinner while the images are loading
            event.item.addHandler('fully-loaded-change', function() {
                // make sure all the images are added
                if (Object.keys(_self.channels).length != _self.osd.world.getItemCount()) {
                    _self.resetSpinner(true);
                    return;
                }

                // make sure all the tiles are fully loaded
                for (var i = 0; i < _self.osd.world.getItemCount(); i++) {
                    if (_self.osd.world.getItemAt(i).opacity != 0 && !_self.osd.world.getItemAt(i).getFullyLoaded()) {
                        _self.resetSpinner(true);
                        return;
                    }
                }

                // hide the spinner (all images are added and loaded)
                _self.resetSpinner();

                _self.osd.drawColorHistogram();
            });

            // when all the images are added
            if(Object.keys(_self.channels).length == _self.osd.world.getItemCount()){
                // finalize loading
                _self.loadAfterOSDInit();

                // make sure the scalebar is correct
                var meterScaleInPixels = _self.parameters.meterScaleInPixels;
                if (meterScaleInPixels) {
                  _self.resetScalebar(meterScaleInPixels);
                }

                // apply the intiial channel filters
                for(var key in _self.channels){
                    var channel = _self.channels[key];
                    _self.setItemChannel({
                        id : channel.id
                    });
                }
            }
        });
    };

    // Add new term
    this.addNewTerm = function(data){

        if(!this.osd || !this.osd.world.getItemAt(0)){
            return;
        }

        var svg = null,
            id = null;
            contentSize = {};

        // if svgID is exist
        if(this.svgCollection.hasOwnProperty(data.svgID)){
            this.dispatchSVGEvent("addNewGroup", data);
        }
        // create a new svg
        else{
            contentSize = this.osd.world.getItemAt(0).getContentSize();
            svg = new AnnotationSVG(this, data.svgID, contentSize.x, contentSize.y);
            svg.render();
            svg.createAnnotationGroup(data.groupID, data.anatomy, data.description); // create a new group
            this.svgCollection[data.svgID] = svg; // add the new svg into collection
            this.resizeSVG(); // resize the svg to align with current OSD viewport
        }

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
        tileSource.pseudoColor = xmlDoc.getAttribute("channelDefaultRGB");
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
            if(this.svgCollection.hasOwnProperty(this.current.svgID)){
                this.svgCollection[this.current.svgID].changeSelectedGroup(this.current);
            }
            this.current.svgID = "";
            this.current.groupID = "";
        }
        else if(this.svgCollection.hasOwnProperty(data.svgID)){
            // if(data.x1 && data.x2 && data.y1 && data.y2){
            //     this.zoomInRectViewport(data)
            // }
            if(this.svgCollection.hasOwnProperty(this.current.svgID)){
                this.svgCollection[this.current.svgID].changeSelectedGroup(this.current);
            }
            this.current.svgID = data.svgID;
            this.current.groupID = data.groupID;

            this.svgCollection[data.svgID].changeSelectedGroup(data);
            this.svg.append(this.svgCollection[data.svgID].svg)
        }

    }

    // Change all SVGs annotations visibility
    this.changeAllAnnotationVisibility = function(isDisplay){
        for(var svgID in this.svgCollection){
            this.svgCollection[svgID].changeAllVisibility(isDisplay);
        }
    }

    // Change scale stroke width
    this.changeStrokeScale = function(strokeScale){
        this.strokeScale = strokeScale;
        for(var svgID in this.svgCollection){
            this.svgCollection[svgID].changeStrokeScale();
        }
    }

    // Change SVG ID
    this.changeSVGId = function(data){

        // Change existing SVG id from the collection
        if(this.svgCollection.hasOwnProperty(data.svgID)){
            var prevSVG = this.svgCollection[data.svgID];
            prevSVG.updateID(data.newSvgID);

            this.svgCollection[data.newGroupID] = prevGroup;

            // update the current svg id if it's also the changing svg id
            if(this.current.svgID === data.svgID){
                this.current.svgID = data.newSvgID;
            };

            delete this.svgCollection[data.svgID];

            // continue to dispatch to parent to handle the necessary updates
            this.dispatchEvent("updateGroupInfo", data);
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
            // Create mousetracker to begin drawing
            case "onDrawingBegin":
                // alert("view start drawing")
                var tracker = new OpenSeadragon.MouseTracker({
                    element: _self.svg,
                    dragHandler: this.onMouseDragToDraw,
                    dragEndHandler: this.onMouseDragToDrawEnd,
                    userData: data
                });
                _self.mouseTrackers.push(tracker);
                break;
            case "updateSVGId":
                var prevSVG = this.svgCollection[data.svgID];
                // update the current object -> change svg ID if matches the old one
                if(this.current.svgID === data.svgID){
                    this.current.svgID = data.newSvgID;
                }
                if(prevSVG){
                    this.svgCollection[data.newSvgID] = prevSVG;
                    delete this.svgCollection[data.svgID];
                }

                this.parent.dispatchEvent("updateSVGId", data);
                break;
            case "updateGroupInfo":
                // update the current object -> change group ID if matches the old one
                if(this.current.groupID === data.groupID){
                    this.current.groupID = data.newGroupID;
                }
                this.parent.dispatchEvent("updateGroupInfo", data);
                break;
            /**
             * [Dispatch events to App]
             */
            // Change current selected annotation group from toolbar
            case "onClickChangeSelectingAnnotation":
                if(_self.mode == modes.ERASE_ANNOTATIONS){
                    this.dispatchSVGEvent("removeAnnotationByGraphID", {
                        svgID : data.svgID,
                        groupID : data.groupID,
                        graphID : data.graphID
                    })
                }
                else if(_self.mode == modes.VIEW){
                    this.changeSelectingAnnotation(data);
                    this.parent.dispatchEvent(type, {
                        svgID : data.svgID,
                        groupID : data.groupID
                    });
                }
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
            // Add a new group
            case "addNewGroup":
                svg.createAnnotationGroup(data.groupID, data.anatomy, data.description);
                break;
            // Change an annotation group's visibility
            case "changeAnnotationVisibility":
                svg.changeVisibility(data);
                break;
            // Change stroke scale
            case "changeStrokeScale":
                svg.changeStrokeScale(data);
                break;
            // Change SVG ID
            case "changeSVGId":
                svg.changeSVGId(data);
                break;
            // Change group information:
            case "changeGroupInfo":
                svg.changeGroupInfo(data);
                break;
            // Drawing annotation on the SVG
            case "drawingStart":
                svg.createAnnotationObject(data.groupID, data.type, data.attrs);
                break;
            // Change the color of the annotation
            case "drawingStrokeChanged":
                svg.changeDrawingStroke(data);
                break;
            // Change current selected annotation group
            case "highlightAnnotation":
                this.changeSelectingAnnotation(data);
                break;
            // Change all annotation groups visibility
            case "changeAllVisibility":
                svg.changeAllVisibility(data.isDisplay);
                break;
            // Remove annotation object from a group
            case "removeAnnotationByGraphID":
                svg.removeAnnotationByGraphID(data.groupID, data.graphID);
                this.dispatchEvent("onMouseoutHideTooltip");
                break;
            // Set annotation groups attributes
            case "setGroupAttributes":
                svg.setGroupAttributes(data);
                break;
            default:
                break;
        }
    }

    // Draw annotation mode on -> only show the related annotation objects
    this.drawAnnotationMode = function(data){
        // Check if the svg id exists
        var svgID, groupID, isDisplay, foundAMatch = false, usedColors = [];
        var mode = data.mode.toUpperCase();

        var setStroke = (data.setStroke === true);
        delete data.setStroke;

        // remove all current mouse trackers
        this.removeMouseTrackers();

        // Hide all annotation objects
        for(svgID in this.svgCollection){
            if(mode == "ON"){
                if(svgID == data.svgID){
                    for(groupID in this.svgCollection[svgID].groups){
                        // indicate whether we found a match or not
                        foundAMatch = foundAMatch || groupID == data.groupID;

                        // only show the matching group
                        isDisplay = (groupID == data.groupID) ? true : false;
                        this.svgCollection[svgID].groups[groupID].setDisplay(isDisplay);

                        // set the drawing tool stroke to be based on the group stroke
                        if (setStroke && groupID == data.groupID) {
                            data.stroke = this.svgCollection[svgID].groups[groupID].stroke[0];
                        }
                    }
                }
                else{
                    this.svgCollection[svgID].changeAllVisibility(false);
                }
            }
            else{
                this.svgCollection[svgID].changeAllVisibility(true);
            }
        };

        // if we didn't find a matching group, use a random stroke
        if (setStroke && !foundAMatch) {
            // TODO could be improved by incorporating it with the other loop
            // find the colors that are used, to avoid duplicate colors
            for (svgID in this.svgCollection) {
                for (groupID in this.svgCollection[svgID].groups) {
                    usedColors = usedColors.concat(this.svgCollection[svgID].groups[groupID].stroke);
                }
            }
            data.stroke = this._utils.generateColor(usedColors);
        }

        this.dispatchEvent("toggleDrawingTool", data);
    }

    /**
     * Export the displayed view of osd viewer to a jpg file.
     * Apart from the osd canvas, it will also add the svg overlays
     * This function will trigger a browser download after processing is done.
     * The messages that will be displatched by this function:
     *  - `downloadViewDone`: when download is done.
     *  - `downloadViewError`: if we encounter an error.
     *
     * @param {String=} fileName - the name of the file that will be downloaded
     */
    this.exportViewToJPG = function (fileName) {
        fileName = fileName ? (fileName + ".jpg") : ("osd_" + Date.parse(new Date()) + ".jpg");

        var self = this,
            canvas, newCanvas, newCtx, rawImg, errored = false,
            svgProcessedCount = 0, svgTotalCount = 0,
            svgAttrs = ["x", "y", "width", "height"], svgDimension = [], svgAttr;

        // add watermark and download the file
        var finalize = function () {
            if (errored) return;

            // add the water mark to the image
            self._utils.addWaterMark2Canvas(newCanvas, self.parameters.waterMark, self.osd.scalebarInstance);

            // turn it into an image
            rawImg = newCanvas.toDataURL("image/jpeg", 1);
            if (rawImg) {
                self._utils.downloadAsFile(fileName, rawImg, "image/jpeg");
                self.dispatchEvent('downloadViewDone');
            } else {
                // TODO proper error object
                self.dispatchEvent('downloadViewError', new Error("Empty image"));
            }
        }

        // get the displayed osd canvas
        if (this.osd.scalebarInstance.pixelsPerMeter) {
            canvas = this.osd.scalebarInstance.getImageWithScalebarAsCanvas();
        } else {
            canvas = self.osd.drawer.canvas;
        }

        // create a canvas the same size as the displayed osd canvas
        newCanvas = document.createElement("canvas");
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        newCtx = newCanvas.getContext("2d");

        // add the osd canvas content to the new canvas
        newCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

        if (!_self.svg) {
            finalize();
            return;
        }

        // add the svg overlays to the new canvas by converting them to image
        // TODO should be refactored
        var svgs = _self.svg.querySelectorAll(".annotationSVG");
        var pixelRatio = self._utils.queryForRetina(newCanvas);
        svgs.forEach(function (svg) {
            svgTotalCount++;
            var img = new Image();
            img.onload = function(e) {
                if (errored) return;

                svgAttrs.forEach(function (attrName) {
                    svgAttr = svg.getAttribute(attrName);
                    if (svgAttr == null) {
                        svgAttr = 0;
                    }
                    if (typeof svgAttr === "string") {
                        svgAttr = svgAttr.replace("px", "");
                    }
                    // osd is property handling pixel ratio, so we don't need to change the canvas settings.
                    // instead while drawing the annotation manually on top of the canvas, we should take care of pixelRatio
                    svgDimension.push(Number(svgAttr) * pixelRatio);
                });

                // add the image to new canvas
                newCtx.drawImage(e.target, svgDimension[0], svgDimension[1], svgDimension[2], svgDimension[3]);

                svgProcessedCount++
                if (svgProcessedCount === svgTotalCount) {
                    finalize();
                }
            };
            img.onerror = function (message, source, lineno, colno, error) {
                console.log(error);

                // only one error message is enough.
                if (errored) return;
                errored = true;

                // TODO proper error object
                self.dispatchEvent('downloadViewError', error);
            }
            // NOTE source has to be defined after onload and onerror
            img.src = null;
            img.src = "data:image/svg+xml;utf8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        });

        // in case there wasn't any svg overlays
        if (svgProcessedCount === svgTotalCount) {
            finalize();
        }
    }

    // Get channels
    this.getChannels = function () {
        return this.channels;
    }

    this.getStrokeScale = function(){
        return this.strokeScale;
    }

    // Load and import the unstructured SVG file into Openseadragon viewer
    this.importAnnotationUnformattedSVG = function (svgs) {
        /*
          We show all the svg files in relative to the position of the first scene,
          even if the svgs might belong to other scenes.
          to make the calculations simpler, we're always positioning the svgs
          relative to the location of first scene (and not the scene that they belong to).
        */
        var ignoreReferencePoint = this.parameters.ignoreReferencePoint,
            ignoreDimension = this.parameters.ignoreDimension,
            imgWidth = this.osd.world.getItemAt(0).getContentSize().x,
            imgHeight = this.osd.world.getItemAt(0).getContentSize().y;

        for(var i = 0; i < svgs.length; i++){
            var id = Date.parse(new Date()) + parseInt(Math.random() * 10000),
                svgFileLocation = svgs[i],
                content = this._utils.getUrlContent(svgFileLocation),
                svgParser = new DOMParser(),
                svgFile = svgParser.parseFromString(content, "image/svg+xml"),
                svgFile = svgFile.getElementsByTagName("svg")[0];

            this.svgCollection[id] = new AnnotationSVG(this, id, imgWidth, imgHeight, this.scale, ignoreReferencePoint, ignoreDimension);
            this.svgCollection[id].parseSVGFile(svgFile);

            if(!content) {
              this.dispatchEvent('errorAnnotation');
            }
        }

    }

    // Load after Openseadragon initialized
    this.loadAfterOSDInit = function(){
        // Only execute it once when Openseadragon is done loading
        if (!_self.isInitLoad) {

            // Check if need to pan to a specific location (if x, y, z are not null)
            if (_self.parameters.x && _self.parameters.y && _self.parameters.z) {
                _self.panTo(_self.parameters.x, _self.parameters.y, _self.parameters.x, _self.parameters.z);
            }

            // Check if `scale` is provided
            if(_self.parameters.scale) {
                _self.scale = _self.parameters.scale;
            }

            // Check if `meterScaleInPixels` if provided
            if(_self.parameters.meterScaleInPixels){
                var meterScaleInPixels = _self.parameters.meterScaleInPixels;
                _self.resetScalebar(meterScaleInPixels);
                _self.osd.scalebar({stayInsideImage: _self.stayInsideImage});
            }

            // Check if annotation svg exists in the url
            if(_self.parameters.svgs) {
                try {
                    _self.importAnnotationUnformattedSVG(_self.parameters.svgs);
                    _self.dispatchEvent('annotationsLoaded');
                } catch (err) {
                    _self.dispatchEvent('errorAnnotation', err);
                }
                _self.resizeSVG();
            }

            _self.isInitLoad = true;

        }

        _self.dispatchEvent('mainImageLoaded');
    }

    /**
     * Load the given list of svg urls and display them as annotations.
     * NOTE: It will remove the existing annotations and only show the new given inputs
     * It will directly dispatch the following messages:
     *   - annotationsLoaded: when all the annotations are processed.
     *   - errorAnnotation: when encountered an error while loading annotations
     * @param {String[]} svgURLs - svg urls
     */
    this.loadSVGAnnotations = function (svgURLs) {
        if (!Array.isArray(svgURLs) || svgURLs.length === 0) {
            _self.dispatchEvent('annotationsLoaded');
            return;
        }
        try {
            // add the svgs
            _self.importAnnotationUnformattedSVG(svgURLs);

            // let caller know that it is done
            _self.dispatchEvent('annotationsLoaded');
        } catch (err) {
            _self.dispatchEvent('errorAnnotation', err);
        }
        _self.resizeSVG();
    }

    // TODO should be moved
    this.getChannelInfo = function (channelNumber) {
        if (!Array.isArray(_self.parameters.channels)) {
            return {};
        }

        var item = _self.parameters.channels.filter(function (el) {
            return el.channelNumber == channelNumber;
        });

        if (item.length === 1) {
            return item[0];
        }
        return {};
    }

    // Load Image and Channel information
    // params: {zIndex, info: {url, channelNumber}}
    this.loadImages = function (params) {
        if (typeof params != 'object' && !Array.isArray(params.info)) {
            return;
        }

        console.log('params: ', params);
        var channelList = [], i, usePreviousChannelInfo = false;

        // show spinner is displayed
        _self.resetSpinner(true);

        // remove the existing images
        if (_self.osd.world.getItemCount() > 0) {

            // if the number of channels between Zs didnt change
            // (this should always be true, it's just an additional check)
            usePreviousChannelInfo = (_self.osd.world.getItemCount() === Object.keys(_self.channels).length);

            // remove existing images
            _self.osd.world.removeAll();
        }

        // process the images
        for (i = 0; i < params.info.length; i++) {
            var channel,
                tileSource,
                info = params.info[i],
                options = {},
                meterScaleInPixels = null;

            var url = info.url;

            var channelInfo = _self.getChannelInfo(info.channelNumber);

            // The below code is for aliasName used in place of channelName
            var channelName = channelInfo.channelName ? channelInfo.channelName : "";
            if (channelInfo.aliasName) {
                channelName = channelInfo.aliasName;
            }
            // use the index for the channelName
            if (typeof channelName !== "string" || channelName.length === 0) {
                channelName = i.toString();
            }

            // create tileSource and options based on the image type
            if (url.indexOf('ImageProperties.xml') !== -1) {
                var xmlString = _self._utils.getUrlContent(url),
                    imgPath = url.replace('/ImageProperties.xml', ''),
                    xmlParser = new DOMParser();

                var xmlDoc = xmlParser.parseFromString(xmlString.trim(), "application/xml");
                xmlDoc = xmlDoc.getElementsByTagName("IMAGE_PROPERTIES")[0];

                // we want to properly define how to get the images from the
                // folder structure that we have for dzi images
                tileSource = options = _self.buildTileSource(xmlDoc, imgPath);
                if (options.channelName) {
                    channelName = options.channelName;
                }
            } else if (url.indexOf("info.json") !== -1){
                // since osd supports iiif images, we can just pass the url
                tileSource = url;
            } else {
                // we have to specify the type, just passing url to osd doesn't work
                tileSource = {
                    type: 'image',
                    url: url
                };
            }

            // make sure the scale is properly defined
            meterScaleInPixels = options.meterScaleInPixels ? options.meterScaleInPixels : meterScaleInPixels;
            meterScaleInPixels = _self.parameters.meterScaleInPixels ? _self.parameters.meterScaleInPixels : meterScaleInPixels;
            _self.scale = (meterScaleInPixels != null) ? 1000000 / meterScaleInPixels : null;

            _self.resetScalebar(meterScaleInPixels);

            if (usePreviousChannelInfo) {
                channel = _self.channels[i];
            } else {
                // pseudoColor
                if (typeof channelInfo.pseudoColor === 'string') {
                    // it might be hex
                    var hexToRGB = _self._utils.colorHexToRGB(channelInfo.pseudoColor);
                    options.pseudoColor = hexToRGB ? hexToRGB : channelInfo.pseudoColor;
                }

                // isRGB
                if (typeof channelInfo.isRGB === 'boolean') {
                    options.isRGB = channelInfo.isRGB;
                }

                // used for internal logic of channel
                options['isMultiChannel'] = (params.info.length > 1);

                // only show a few first
                options["isDisplay"] = (i < _self.config.constants.MAX_NUM_DEFAULT_CHANNEL);

                // add to the list of channels
                channel = new Channel(i, channelName, info.channelNumber, options);

                _self.channels[i] = channel;
                channelList.push({
                    name: channel.name,
                    contrast: channel["contrast"],
                    brightness: channel["brightness"],
                    gamma: channel["gamma"],
                    saturation: channel["saturation"],
                    hue : channel["hue"],
                    showGreyscale : channel['showGreyscale'],
                    osdItemId: channel["id"],
                    isDisplay: channel["isDisplay"]
                });
            }


            // add the image
            _self.osd.addTiledImage({
                tileSource: tileSource,
                compositeOperation: 'lighter',
                opacity: (channel["isDisplay"] ? 1 : 0)
            });
        }

        if (!usePreviousChannelInfo) {
            // Dispatch event to toolbar to update channel list
            _self.dispatchEvent('replaceChannelList', channelList);
        }

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
            document.querySelector("#" + this.config.osd.id).insertAdjacentHTML('beforeend', tooltipElem);
            this.tooltipElem = d3.select("div#annotationTooltip");
        }

        this.tooltipElem
            .style("display", "flex")
            .transition()
            .duration(300)
            .style("opacity", 0.9)
            .style("left", (data.x + 20) + "px")
            .style("top", (data.y + 20) + "px");
    }

    // Move annotation tooltip when mouse move on Openseadragon viewer
    this.onMousemoveShowTooltip = function(data){
        if(!this.tooltipElem || !data){
            return;
        }

        this.tooltipElem
            .style("left", (data.x + 20) + "px")
            .style("top", (data.y + 20) + "px");
    }

    // Hide annotation tooltip when mouse out of the annotation on Openseadragon viewer
    this.onMouseoutHideTooltip = function(){
        if(!this.tooltipElem){
            return;
        }

        this.tooltipElem
            // .transition()
            // .duration(300)
            .style("opacity", 0)
            .remove();
    }

    // Drag to draw event handler start
    this.onMouseDragToDraw = function(event){
        var annotation = event.userData.annotation;
        var viewBox = event.userData.viewBox;
        var scaleX = event.userData.imgScaleX || 1;
        var scaleY = event.userData.imgScaleY || 1;
        var view_coords = _self.osd.viewport.viewerElementToViewportCoordinates(new OpenSeadragon.Point(event.position.x, event.position.y));
        var img_coords = _self.osd.viewport.viewportToImageCoordinates(view_coords);

        img_coords.x = viewBox[0] + (img_coords.x * scaleX);
        img_coords.y = viewBox[1] + (img_coords.y * scaleY);

        // console.log(event.position, img_coords);
        annotation.insertPoint(img_coords);

    }

    // Drag to draw event handler end
    this.onMouseDragToDrawEnd = function(event){

        if (event.userData.type == "POLYGON") {
            event.userData.annotation.insertPointAtDrawEnd();
            return;
        }

        if (_self.mouseTrackers.length > 0) {
            setTimeout(function () {
                _self.mouseTrackers[0].destroy();
                _self.mouseTrackers.shift();
            }, 300)
        }

        event.userData.annotation.setDrawing(false);

        var svgID = event.userData.svgID;
        var groupID = event.userData.groupID;
        var type = event.userData.type;
        var attrs = event.userData.attrs || {};

        if (_self.svgCollection[svgID] && _self.svgCollection[svgID].groups[groupID]) {
            event.userData.annotation = _self.svgCollection[svgID].groups[groupID].addAnnotation(type);
            event.userData.annotation.setupDrawingAttrs(attrs);
            event.userData.graphID = event.userData.annotation.id;

            var mousetracker = new OpenSeadragon.MouseTracker({
                element: _self.svg,
                dragHandler: _self.onMouseDragToDraw,
                dragEndHandler: _self.onMouseDragToDrawEnd,
                userData: event.userData
            });

            _self.mouseTrackers.push(mousetracker);
        }
        // _self.destoryMouseTracker();
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

    this.removeAllSVGAnnotations = function () {
        // remove the existing svgs
        var svgIDs = Object.keys(_self.svgCollection);
        svgIDs.forEach(function (id) {
            _self.removeSVG(id);
        });
    }

    // Remove specific svg object by svgID
    this.removeSVG = function(svgID){
        var svgObj = this.svgCollection[svgID];

        if(svgObj){
            // remove all the groups, which contain annotations
            svgObj.removeAllGroups();

            // remove svg element
            svgObj.svg.remove();

            delete this.svgCollection[svgID];
        }
    }

    // Remove overlay
    this.removeOverlay = function (element) {
        this.osd.removeOverlay(element);
    }

    // Remove mouse trackers for drawing
    this.removeMouseTrackers = function(data){

        if(this.mouseTrackers.length > 0){

            while(this.mouseTrackers.length > 0){
                var tracker = this.mouseTrackers.shift();
                var userData = tracker.userData;

                if(userData && userData.type != 'POLYGON'){
                    this.dispatchSVGEvent("removeAnnotationByGraphID", {
                        svgID : userData.svgID,
                        groupID : userData.groupID,
                        graphID : userData.graphID
                    })
                }

                setTimeout(function(){
                    tracker.destroy();
                }, 300)
            }
        }
    }

    this.resetSpinner = function (show) {
        if (this.config.osd.spinnerID) {
            var sp = document.querySelector("#" + this.config.osd.spinnerID);
            if (sp) {
                sp.style.display = (show ? 'block' : 'none');
            }
        }
    };

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

    /**
     * This function reads the URL param zoomLineThickness, and decides which stroke-width scale function to select
     * log = the thickness vaires according to the log of the current zoom level. Since at each zoom in/out the zoom level changes by a factor of 2, i.e. it changes exponentially, therefore using a log approach provides linear change in line-thickness with respect to each zoom in/out click.
     * default = using the original function, i.e. mapping the line thickness linearly with the total zoom levels avaibale in the OSD
     * @return {function} the function is responsible for how the line-thickness vaires with respect of current zoom level
     */
    this.getStrokeWidthScaleFunction = function () {
        switch (this.parameters.zoomLineThickness) {
            case 'log':
                return function (value) {
                    var minZoom = _self.osd.viewport.getMinZoom();
                    var maxZoom = _self.osd.viewport.getMaxZoom();
                    var zoomLevels = Math.ceil(Math.log2(maxZoom) - Math.log2(minZoom));
                    var currentZoomLevel = Math.ceil(Math.log2(value) - Math.log2(minZoom));

                    var delta = _self.strokeMaxScale - _self.strokeMinScale;
                    var result = delta * currentZoomLevel / zoomLevels;

                    return Math.max(_self.strokeMinScale, _self.strokeMaxScale - result);
                };
            default:
                return d3.scaleLinear()
                    .domain([_self.osd.viewport.getMinZoom(), _self.osd.viewport.getMaxZoom()])
                    .range([_self.strokeMaxScale, _self.strokeMinScale])
                    .nice();
        }
    }

    // Resize Annotation SVGs
    this.resizeSVG = function(){
        // this might be called while we're changing the main image
        if (_self.osd.world.getItemCount() == 0) return;

        var svgs = _self.svg.querySelectorAll(".annotationSVG"),
            // upperLeftPoint,
            // bottomRightPoint,
            i,
            w = _self.osd.world.getItemAt(0),
            size = w.getContentSize(),
            strokeScale = null;

        // removed the if condition because the function would need to change if the window has been resized
        _self.strokeWidthScale = _self.getStrokeWidthScaleFunction();

        strokeScale = _self.strokeWidthScale(_self.osd.viewport.getZoom())
        _self.changeStrokeScale(strokeScale);
        _self.dispatchEvent("onChangeStrokeScale", {
            "strokeScale" : strokeScale
        });

        for(i = 0; i < svgs.length; i++){
            // upperLeftPoint = svgs[i].getAttribute("upperLeftPoint").split(",") || [];
            // bottomRightPoint = svgs[i].getAttribute("bottomRightPoint").split(",") || [];
            // if(upperLeftPoint.length == 0 || bottomRightPoint.length == 0){
            //     continue;
            // }
            // upperLeftPoint = _self.osd.viewport.pixelFromPoint(new OpenSeadragon.Point(+upperLeftPoint[0], +upperLeftPoint[1]), true);
            // bottomRightPoint = _self.osd.viewport.pixelFromPoint(new OpenSeadragon.Point(+bottomRightPoint[0], +bottomRightPoint[1]), true);

            var ignoreReferencePoint = svgs[i].getAttribute("ignoreReferencePoint") == "false" ? false : true;
            var ignoreDimension = svgs[i].getAttribute("ignoreDimension") == "false" ? false : true;
            var scale = svgs[i].getAttribute("scale") ? parseFloat(svgs[i].getAttribute("scale")) : false;
            var viewBox = svgs[i].getAttribute("viewBox").split(" ").map(function(value){ return +value});
            // console.log(viewBox);
            var topLeft = ignoreReferencePoint ? {x: 0, y : 0 } : {x: viewBox[0], y : viewBox[1] };
            var bottomRight = ignoreDimension ? {x: size.x, y : size.y } : {x: topLeft.x + viewBox[2], y : topLeft.y + viewBox[3]};
            // var topLeft = {x: _self.osd.world.getItemAt(1).getBounds(true).x + _self.osd.world.getItemAt(0).getBounds(true).x, y : 0 };
            // var bottomRight = {x: topLeft.x + size.x, y : topLeft.y + size.y};

            // not ignoring the reference point and the scale is provided
            if(scale){
                if(!ignoreReferencePoint){
                    topLeft.x = topLeft.x / scale;
                    topLeft.y = topLeft.y / scale;
                }
                if(!ignoreDimension){
                    bottomRight.x = bottomRight.x / scale;
                    bottomRight.y = bottomRight.y / scale;
                }
            }
            topLeft = w.imageToViewerElementCoordinates(new OpenSeadragon.Point(topLeft.x, topLeft.y));
            bottomRight = w.imageToViewerElementCoordinates(new OpenSeadragon.Point(bottomRight.x, bottomRight.y));
            svgs[i].setAttribute("x", topLeft.x + "px");
            svgs[i].setAttribute("y", topLeft.y + "px");
            svgs[i].setAttribute("width", bottomRight.x - topLeft.x + "px");
            svgs[i].setAttribute("height", bottomRight.y - topLeft.y + "px");
        }
    }

    // Save Anatomy SVG file
    this.saveAnatomySVG = function(data){
        var svgID = data.svgID || "",
            groupID = data.groupID,
            rst = [];

        if(this.svgCollection.hasOwnProperty(svgID)){
            rst = this.svgCollection[svgID].exportToSVG(groupID);
        };

        _self.dispatchEvent("saveGroupSVGContent", rst);
    }

    // Set Openseadragon viewer item visibility
    this.setItemVisibility = function (id, isDisplay) {
        var item = this.osd.world.getItemAt(id),
            opacity = (isDisplay) ? 1 : 0;
        this.channels[id].setIsDisplay(isDisplay);
        item.setOpacity(opacity);
    }

    // Set Openseadragon viewer item channel values
    this.setItemChannel = function (data) {
        var channel = this.channels[data.id],
            item = this.osd.world.getItemAt(data.id);
        if (!channel || !item) { return; }
        if ("settings" in data) {
            channel.setMultiple(data.settings);
        } else {
            channel.set(data.type, data.value);
        }

        this.filters[data.id] = {
          items: [item],
          processors: channel.getFiltersList()
        }
        var filters = [];
        this.osd.emptyColorHistogram();
        for (var key in this.filters){
          filters.push(this.filters[key])
        }

        this.osd.setFilterOptions({
          filters: filters
        });

        // the below one updates the last channel name as the filter for the osd. In case of multiple channels, this won't work.
        // this.osd.setFilterOptions({
        //     filters: [
        //         {
        //             items: [item],
        //             processors: channel.getFiltersList()
        //         }
        //     ]
        // })
    }

    // Set the viewer into different mode
    this.setMode = function(data){
        // clear all the mouse tracker listeners
        this.removeMouseTrackers();

        switch(data.mode){
            case modes.ERASE_ANNOTATIONS:
                _self.mode = modes.ERASE_ANNOTATIONS;
                break;
            case modes.VIEW:
                _self.mode = modes.VIEW;
                break;
        }
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


    /**
     * used by savedAnnotationGroupState and discardAnnotationChange
     * @type {Object}
     */
    this.savedAnnotationGroupStates = {};

    /**
     * This functions creates a copy of the SVG file of the annotation group that is being edited
     * TODO there should be a mechanism to delete the unused savedAnnotationGroupStates objects
     * @param {object} data contains the groupID and svgID of the annotation that is being edited
     */
    this.saveAnnotationGroupState = function (data) {
        if (!(data.svgID in this.svgCollection) || !(data.groupID in this.svgCollection[data.svgID].groups)) {
            return;
        }

        var group = this.svgCollection[data.svgID].groups[data.groupID];

        if (!(data.svgID in this.savedAnnotationGroupStates)) {
            this.savedAnnotationGroupStates[data.svgID] = {};
        }
        this.savedAnnotationGroupStates[data.svgID][data.groupID] = group.exportToSVG();
    }

    /**
     * This functions firsts deletes the annoation, and then re-loads it using the copy stored in this.savedAnnotationGroupStates
     * TODO we shouldn't remove and create all the times, we should keep track of whether something changed or not
     * @param {object} data contains the groupID and svgID of the annotation whoes edit is being cancelled
     */
    this.discardAnnotationGroupChanges = function (data) {
        var svgID = data.svgID, groupID = data.groupID;

        // if the group has not been saved, we cannot do anything about it
        if (!(svgID in this.savedAnnotationGroupStates) || !(groupID in this.savedAnnotationGroupStates[svgID])) {
            return;
        }

        // make sure the svgID is valid
        if (!(svgID in this.svgCollection)) {
            return;
        }

        var svgAnnotation = this.svgCollection[svgID],
            savedState = this.savedAnnotationGroupStates[svgID][groupID];

        if (svgAnnotation.groups[groupID]) {
            // remove all the annotations under the group
            svgAnnotation.groups[groupID].removeAllAnnotations();

            // delete the group
            delete svgAnnotation.groups[groupID];
        }

        // add the saved state
        var svgFile = new DOMParser().parseFromString(savedState, "image/svg+xml");
        svgAnnotation.parseSVGNodes(svgFile.childNodes);

        // make sure svg is rendered properly
        this.resizeSVG();

        // delete the saved state
        delete savedState;
    }
}
