var OSDViewer = (function (_config) {

    var _config = _config || {},
        utils = new Utils(),
        viewer = null,
        toolbar = null;

    var alertService = new AlertService(utils);
    var errorService = new ErrorService(utils);

    var init = function(){
        viewer = new Viewer(this, _config.viewer);
        toolbar = new ToolbarController(this, _config.toolbar);

        // if there are query parameters, we should initialize viewer
        var url = document.location.href;
        if (url.indexOf("?") != -1) {
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
            // [Events from Viewer]
            // Send the updated annotation list to toolbar
            case "updateAnnotationList":
                // toolbar && toolbar.updateAnnotationList(data);
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "disableChannelList":
                // toolbar && toolbar.updateAnnotationList(data);
                window.parent.postMessage({messageType: type}, window.location.origin);
                break;
            case "disableAnnotationSidebar":
                // toolbar && toolbar.updateAnnotationList(data);
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
                // toolbar && toolbar.changeSelectingAnnotation(data);
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            case "errorAnnotation":
                // toolbar && toolbar.changeSelectingAnnotation(data);
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
                console.log('fetchZPlaneList');
                window.parent.postMessage({messageType: type, content: data}, window.location.origin);
                break;
            // ask chaise to fetch new set of images
            case "fetchZPlaneListByZIndex":
                console.log('fetchZPlaneListByZIndex');
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
                case 'filterChannels':
                    toolbar && toolbar.onClickedMenuHandler('channelList');
                    break;
                case 'hideAllAnnotations':
                    toolbar && toolbar.hideAnnotationList();
                    break;
                case 'showAllAnnotations':
                    toolbar && toolbar.showAnnotationList();
                    break;
                case "openAnnotations":
                    toolbar && toolbar.onClickedMenuHandler('annotationList');
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
                // case 'loadFilteringPropertyList':
                //     event_loadFilteringPropertyList(messageType, data);
                //     break;
                // case 'fullPageView':
                //     fullPageClick();
                //     break;
                // case 'loadAnnotations':
                //     event_loadAnnotations(messageType, data);
                //     break;
                // case 'centerAnnotation':
                //     var annotation = convertToAnnotation(data);
                //     centerAnnoByHash(getHash(annotation),true);
                //     break;
                // case 'highlightAnnotation':
                //     var annotation = convertToAnnotation(data);
                //     highlightAnnoByHash(getHash(annotation));
                //     break;
                // case 'unHighlightAnnotation':
                //     annoUnHighlightAnnotation(null);
                //     break;
                // case 'syncVisibility':
                //     for (var i = 0, len = data.length; i < len; i++) {
                //         var annotation = convertToAnnotation(data[i]);
                //         var existingAnnotation =
                //             annoRetrieveByHash(getHash(annotation));
                //         existingAnnotation.shapes = annotation.shapes;
                //         updateAnnotationDOMWithStyle(annotation);
                //     }
                //     break;
                // case 'drawAnnotation':
                //     myAnno.activateSelector();
                //     break;
                // case 'createAnnotation':
                //     event_createAnnotation(messageType, data);
                //     break;
                // case 'cancelAnnotationCreation':
                //     cancelEditor();
                //     break;
                // case 'updateAnnotation':
                //     var newAnnotationData = convertToAnnotation(data);
                //     var existingAnnotation = annoRetrieveByHash(getHash(newAnnotationData));
                //     existingAnnotation.text = newAnnotationData.text;
                //     existingAnnotation.shapes = newAnnotationData.shapes;
                //     updateAnnotationDOMWithStyle(newAnnotationData);
                //     break;
                // case 'deleteAnnotation':
                //     var annotation = convertToAnnotation(data);
                //     annotation = annoRetrieveByHash(getHash(annotation));
                //     myAnno.removeAnnotation(annotation);
                //     break;
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
        init : init,
        dispatchEvent : dispatchEvent,
        receiveChaiseEvent : receiveChaiseEvent
    }
}(_config));


window.OSDViewer = OSDViewer;

OSDViewer.init();

// allow tooltips to be defined as attribute
tippy.setDefaultProps({theme: 'light', allowHTML: true});
tippy('[data-tippy-content]');
