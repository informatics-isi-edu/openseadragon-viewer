function Viewer(parent, config) {

    const modes = {
        "VIEW" : 'VIEW',
        "ERASE_ANNOTATIONS" : 'ERASE_ANNOTATIONS'
    }

    var _self = this;

    this._utils = null;
    // this._config = config;
    this.all_config = config;
    this._config = null;

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
    this.init = function (utils) {

        if (!OpenSeadragon || !utils) {
            return null;
        }
        this._utils = utils;

        // Add each image source into Openseadragon viewer
        this.parameters = this._utils.getParameters();

        // Setting the config based on the type of the image we get
        this._config = this._utils.setOsdConfig(this.parameters, this.all_config);
        // console.log("Config used: ",  this._config, this.parameters);  // TODO: If config is null, give an error.

        // Get config from scalebar and Openseadragon - Move this to loadimages
        // this._config.osd.tileSources = this.parameters.info;
        this.loadImages(this.parameters)


        // Add a SVG container to contain svg objects - move to load images
        // this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // this.svg.setAttribute("id", this._config.svg.id);
        // this.osd.canvas.append(this.svg);

        /* Parse urls to load image and channels, This is done when so that czi format is also supported, if the parameters are not present,
        it assumes that the format of the files is in czi. The below mentioned function uses the old version of code to load the images in OpenSeadragon.
        // NOTE: This also assuumes there won't be a svg for czi format(for overalpping).
        */
        // if (this.parameters.info === undefined) { // REmove this
        // this.loadImages(this.parameters.images);
        // }
        this.osd.addHandler('open', this.loadAfterOSDInit);

        // Since 'open' event is no longer called properly, load initial position in 'animation-finish' event
        this.osd.addHandler('animation-finish', this.loadAfterOSDInit);

        // this.osd.addHandler('resize', this.resizeSVG); // Moved to tiff as only they have svg

        // this.osd.addHandler('animation', this.resizeSVG);// Moved to tiff as only they have svg

        this.osd.addHandler('canvas-double-click', this.zoomIn.bind(this));

        this.osd.world.addHandler('add-item', function() {
            if(Object.keys(_self.channels).length == _self.osd.world.getItemCount()){
                var meterScaleInPixels = _self.parameters.meterScaleInPixels;
                if (meterScaleInPixels) {
                  _self.resetScalebar(meterScaleInPixels);
                }
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
            svgProcessedCount = 0, svgTotalCount = 0;

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

        // add the svg overlays to the new canvas by converting them to image
        for (var svgID in self.svgCollection) {
            if (!self.svgCollection.hasOwnProperty(svgID)) continue;

            svgTotalCount++;
            var annotSVG = self.svgCollection[svgID], img = new Image();
            img.onload = function(e) {
                if (errored) return;

                // add the image to new canvas
                newCtx.drawImage(
                    e.target,
                    parseFloat(annotSVG.svg.getAttribute("x")),
                    parseFloat(annotSVG.svg.getAttribute("y")),
                    parseFloat(annotSVG.svg.getAttribute("width")),
                    parseFloat(annotSVG.svg.getAttribute("height"))
                );

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
            img.src = "data:image/svg+xml;utf8," + encodeURIComponent(new XMLSerializer().serializeToString(annotSVG.svg));
        }

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

            // svgs are currently only supported for tiff case
            if (_self.parameters.type !== "tiff") {
                _self.dispatchEvent('disableAnnotationSidebar', true);
                if (_self.parameters.svgs) {
                    // TODO should be changed to a proper warning (error)
                    console.log("annotations are not supported on this type of images.");
                    _self.parameters.svgs = [];
                }
            } else {
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
            }


            // Check if channelName is provided
            if(_self.parameters.channelName){
                var channelsParams = _self.parameters.channelName;
                var channelList = [];

                for(var i = 0; i < channelsParams.length; i++){
                    channel = new Channel(i, {
                        channelName : channelsParams[i]
                    });

                    _self.channels[i] = channel;
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
                _self.dispatchEvent('updateChannelList', channelList);
            }
            _self.isInitLoad = true;
            _self.dispatchEvent('osdInitialized');

        };
    }

    /**
     * Load the given list of svg urls and display them as annotations.
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
            _self.importAnnotationUnformattedSVG(svgURLs);
            _self.dispatchEvent('annotationsLoaded');
        } catch (err) {
            _self.dispatchEvent('errorAnnotation', err);
        }
        _self.resizeSVG();
    }

    // Load Image and Channel information
    this.loadImages = function (params) {

      switch (params.type) { // Add image to osd based on image type
        case 'tiff': // The order in which tilesources is added and osd is initialized is different in tiff and rest of the image type.
          // That is the reason why OpenSeadragon's constructor is called in switch case instead of general call.
          this._config.osd.tileSources = params.info;
          if(this._config.osd.tileSources.length > 1) {
            this.stayInsideImage = false;
            this._config.osd.collectionRows = 1;
            this._config.osd.collectionMode = true;

          }
          this.osd = OpenSeadragon(this._config.osd);
          this.osd.scalebar(this._config.scalebar);
          this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          this.svg.setAttribute("id", this._config.svg.id);
          this.osd.canvas.append(this.svg);
          this.osd.addHandler('resize', this.resizeSVG);
          this.osd.addHandler('animation', this.resizeSVG);
          break;

        default:
          this.osd = OpenSeadragon(this._config.osd);
          this.osd.scalebar(this._config.scalebar);

          var urls = params.images || [],
            channelList = [],
            i;
          for (i = 0; i < urls.length; i++) {
              var isImageSimpleBase = urls[i].indexOf('ImageProperties.xml') == -1 ? true : false,
                  channel,
                  url = urls[i],
                  option = {},
                  meterScaleInPixels = null;

              if (isImageSimpleBase) {
                  // The below code is for aliasName used in place of channelName
                  var channelName = this.parameters.aliasName.length > i ? this.parameters.aliasName[i] : this.parameters.channelName[i];
                  option = {
                      tileSource: {
                          channelName : channelName,
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
                  option.compositeOperation = 'lighter';
              }

              channel = new Channel(i, option.tileSource);

              meterScaleInPixels = option.tileSource.meterScaleInPixels ? option.tileSource.meterScaleInPixels : meterScaleInPixels;
              meterScaleInPixels = this.parameters.meterScaleInPixels ? this.parameters.meterScaleInPixels : meterScaleInPixels;
              this.scale = (meterScaleInPixels != null) ? 1000000 / meterScaleInPixels : null;

              this.resetScalebar(meterScaleInPixels);

              this.channels[i] = channel;
              channelList.push({
                  name: channel.name,
                  contrast: channel["contrast"],
                  brightness: channel["brightness"],
                  gamma: channel["gamma"],
                  hue : channel["hue"],
                  osdItemId: channel["id"]
              });
              this.osd.addTiledImage(option);
          }

          // Dispatch event to toolbar to update channel list
          this.dispatchEvent('updateChannelList', channelList);
          this.loadAfterOSDInit();
          break;
      }
    }

    // this.loadImages = function (urls) {
    //
    //     var urls = urls || [],
    //         channelList = [],
    //         i;
    //
    //
    // }

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

        if(_self.mouseTrackers.length > 0){
            setTimeout(function(){
                _self.mouseTrackers[0].destroy();
                _self.mouseTrackers.shift();
            }, 300)
        }

        event.userData.annotation.setDrawing(false);

        var svgID = event.userData.svgID;
        var groupID = event.userData.groupID;
        var type = event.userData.type;
        var attrs = event.userData.attrs || {};


        if(_self.svgCollection[svgID] && _self.svgCollection[svgID].groups[groupID]){
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

                if(userData){
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
        item.setOpacity(opacity);
        this.channels[id].opacity = opacity;
    }

    // Set Openseadragon viewer item channel values
    this.setItemChannel = function (data) {
        var channel = this.channels[data.id],
            item = this.osd.world.getItemAt(data.id);
        if (!channel || !item) { return; }
        channel.set(data.type, data.value);
        // console.log(data, channel, item);

        this.filters[data.id] = {
          items: [item],
          processors: channel.getFiltersList()
        }
        var filters = [];
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
     * This functions creates a copy of the SVG file of the annotation that is being edited
     * @param {object} data contains the groupID and svgID of the annotation that is being edited
     */
    this.saveAnnotationState = function (data) {
        console.log(data);
        if (data.svgID in this.svgCollection) {
            this.svgFiles = [];
            for (groupID in this.svgCollection[data.svgID].groups) {
                this.svgFiles.push(this.svgCollection[data.svgID].exportToSVG(groupID));
            }
        }
    }

    /**
     * This functions firsts deletes the annoation, and then re-loads it using the copy stored in this.svgFiles
     * @param {object} data contains the groupID and svgID of the annotation whoes edit is being cancelled
     */
    this.discardAnnotationChanges = function (data) {
        if (data.svgID in this.svgCollection) {
            this.removeSVG(data.svgID);
            
            var ignoreReferencePoint = this.parameters.ignoreReferencePoint,
                ignoreDimension = this.parameters.ignoreDimension,
                imgWidth = this.osd.world.getItemAt(0).getContentSize().x,
                imgHeight = this.osd.world.getItemAt(0).getContentSize().y;

            for (var i = 0; i < this.svgFiles.length; i++) {
                var svgFile = this.svgFiles[i];

                for (j = 0; j < svgFile.length; j++) {

                    var id = svgFile[j].svgID,
                        content = svgFile[j].svg,
                        svgParser = new DOMParser(),
                        svgFile = svgParser.parseFromString(content, "image/svg+xml"),
                        svgFile = svgFile.getElementsByTagName("svg")[0];


                    this.svgCollection[id] = new AnnotationSVG(this, id, imgWidth, imgHeight, this.scale, ignoreReferencePoint, ignoreDimension);
                    this.svgCollection[id].parseSVGFile(svgFile);

                    if (!content) {
                        this.dispatchEvent('errorAnnotation');
                    }
                }
            }
            this.resizeSVG();
        }
    }
}
