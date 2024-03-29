var OSDViewer = (function (_config) {

    var _config = _config || {},
        utils = new Utils(),
        viewer = null,
        toolbar = null;

    var alertService = new AlertService();
    var errorService = new ErrorService();
    var constants = new Constants();

    var init = function(){
        viewer = new Viewer(this, _config.viewer);
        toolbar = new ToolbarController(this, _config.toolbar);

        // if there are query parameters, we should initialize viewer
        var url = document.location.href;
        if (url.indexOf("?") != -1) {
            // TODO we don't need to pass utils anymore
            viewer.init(utils, utils.getQueryParams(url));
        }

        window.addEventListener('message', receiveChaiseEvent);

        // let parent window know that the app is loaded
        window.parent.postMessage({messageType: 'osdLoaded'}, window.location.origin);

        this.viewer = viewer;
        this.toolbar = toolbar;
    };

    var dispatchEvent = function(type, data){

        switch(type){
            case "showAlert":
            case "showPopupError":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            // [Events from Toolbar]
            case "changeAnnotationVisibility": // Change annotation group visibility
            case "highlightAnnotation": // Highlight selecting annotation group
            case "changeAllVisibility": // Change all annotations visibility
            case "setGroupAttributes": // Change annotation 'description' or 'anatomy' text
            case "drawingStart":
            case "drawingStrokeChanged":    //change the color of annotation that is being drawn/editted
                viewer.dispatchSVGEvent(type, data);
                break;
            case "drawingStop":
                viewer.removeMouseTrackers(data);
                break;
            case "setMode":
                viewer.setMode(data);
                break;
            case "saveAnatomySVG":
                viewer.saveAnatomySVG(data);
                break;
            case 'toggleChannelNamesOverlay':
                viewer.toggleChannelNamesOverlay();
                break;
            // Change openseadragon item overlay visibility
            case "changeOsdItemVisibility":
                viewer.setItemVisibility(data.osdItemId, data.isDisplay);
                break;
            // Change openseadragon item channel setting
            case "changeOsdItemChannelSetting":
                viewer.setItemChannel(data);
                break;
            case "zoomIn":
                viewer.zoomIn();
                break;
            case "zoomOut":
                viewer.zoomOut();
                break;
            // Text annotation input font size change
            case "changeTextSize":
                viewer.dispatchSVGEvent(type, data);
                break;
            // [Events from Viewer]
            // Send the updated annotation list to toolbar
            case "updateAnnotationList":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "disableChannelList":
                window.parent.postMessage({messageType: type}, window.location.origin);
                break;
            case "disableAnnotationSidebar":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "saveGroupSVGContent":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            // Show Annotation Tool
            case "toggleDrawingTool":
                toolbar && toolbar.toggleDrawingTool(data);
                break;
            // Update svg id in toolbar
            case "updateSVGId":
                toolbar && toolbar.updateDrawingSVGId(data);
                break;
            // Update group id in toolbar
            case "updateGroupInfo":
                toolbar && toolbar.updateDrawingGroupId(data);
                break;
            case "hideChannelList":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "showChannelList":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "updateChannelList":
                toolbar && toolbar.updateChannelList(data);
                break;
            case "replaceChannelList":
                toolbar && toolbar.replaceChannelList(data);
                break;
            case "onChangeStrokeScale":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "onClickChangeSelectingAnnotation":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "errorAnnotation":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "annotationsLoaded":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "mainImageLoaded":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "mainImageLoadFailed":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "downloadViewDone":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "downloadViewError":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "openDrawingHelpPage":
                window.parent.postMessage({messageType: type}, window.location.origin);
                break;
            // initialzie the view
            case "initializeZPlaneList":
                toolbar && toolbar.initializeZPlaneList(data);
                break;
            // ask chaise to fetch new set of images
            case "fetchZPlaneList":
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            // ask chaise to fetch new set of images
            case "fetchZPlaneListByZIndex":
                window.parent.postMessage({ messageType: type, content: data }, window.location.origin);
                break;
            // update the displayed image
            case "updateMainImage":
                // remove the annotations
                viewer.removeAllSVGAnnotations();

                // ask chaise to update the rest of page (fetch annotaion, etc)
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);

                // ask viewer to update the displayed image
                viewer.loadImages(data);
                break;
            case "updateDefaultZIndex":
                window.parent.postMessage({ messageType: type, content: data }, window.location.origin);
                break;
            case "updateChannelConfig":
                window.parent.postMessage({ messageType: type, content: data }, window.location.origin);
                break;
        }
    }

    var receiveChaiseEvent = function(event){

        if (event.origin === window.location.origin) {
            var messageType = event.data.messageType;
            var data = event.data.content;
            switch (messageType) {
                case 'initializeViewer':
                    viewer.init(utils, data);
                    break;
                case 'updateZPlaneList':
                    toolbar && toolbar.updateZPlaneList(data);
                    break;
                case 'updateDefaultZIndexDone':
                    toolbar && toolbar.updatedDefaultZIndex(data);
                    break;
                case "updateChannelConfigDone":
                    toolbar && toolbar.updateChannelConfigDone(data);
                    break;
                case 'toggleChannelList':
                    toolbar && toolbar.onClickedMenuHandler('channelList');
                    break;
                case 'zoomInView':
                    viewer.zoomIn();
                    break;
                case 'zoomOutView':
                    viewer.zoomOut();
                    break;
                case 'homeView':
                    viewer.resetHomeView();
                    break;
                case 'downloadView':
                    viewer.exportViewToJPG(data);
                    break;
                case 'highlightAnnotation':
                case 'changeAnnotationVisibility':
                case 'changeSVGId':
                case 'changeGroupInfo':
                    viewer.dispatchSVGEvent(messageType, data);
                    break;
                case 'changeAllAnnotationVisibility':
                    viewer.changeAllAnnotationVisibility(data.isDisplay);
                    break;
                case 'changeStrokeScale':
                    viewer.changeStrokeScale(data);
                    break;
                case 'drawAnnotationMode':
                    viewer.drawAnnotationMode(data);
                    break;
                case 'addNewTerm':
                    viewer.addNewTerm(data);
                    break;
                case 'removeSVG':
                    viewer.removeSVG(data.svgID);
                    break;
                // Save the svg file with matching group ID and return it to Chaise Viewer
                case 'saveAnnotationRecord':
                    viewer.saveAnatomySVG(data);
                    break;
                case "loadAnnotations":
                    viewer.loadSVGAnnotations(data);
                    break;
                case "discardAnnotationChange":
                    viewer.discardAnnotationGroupChanges(data);
                    break;
                case "startAnnotationChange":
                    viewer.saveAnnotationGroupState(data);
                    break;
                default:
                    console.log('No matched action performed. Received message event: ', messageType, ' data:', data);
            }
        } else {
            console.log('Invalid event origin. Event origin: ', event.origin, '. Expected origin: ', window.location.origin);
        }
    }

    return {
        alertService: alertService,
        errorService: errorService,
        utils: utils,
        constants: constants,
        init : init,
        dispatchEvent : dispatchEvent,
        receiveChaiseEvent : receiveChaiseEvent,
        utils: utils
    }
}(_config));


window.OSDViewer = OSDViewer;

OSDViewer.init();

// allow tooltips to be defined as attribute
tippy.setDefaultProps({theme: 'light', allowHTML: true});
tippy('[data-tippy-content]');
