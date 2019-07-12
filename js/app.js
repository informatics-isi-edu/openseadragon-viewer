var myApp = (function (_config) {

    var _config = _config || {},
        utils = new Utils(),
        viewer = null,
        toolbar = null;

    var init = function(){
        viewer = new Viewer();
        toolbar = new ToolbarController(viewer, _config.toolbar);
        viewer.init(utils, _config.viewer, toolbar);
        window.addEventListener('message', receiveChaiseEvent);

        this.viewer = viewer;
        this.toolbar = toolbar;
    };

    var receiveChaiseEvent = function(event){

        if (event.origin === window.location.origin) {
            var messageType = event.data.messageType;
            var data = event.data.content;
            switch (messageType) {
                case 'filterChannels':
                    toolbar.onClickedMenuHandler('channelList');
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
                case "openAnnotations":
                    toolbar.onClickedMenuHandler('annotationList');
                    break;
                case 'hideAllAnnotations':
                    toolbar.hideAnnotationList();
                    break;
                case 'showAllAnnotations':
                    toolbar.showAnnotationList();
                    break;
                case 'downloadView':
                    viewer.exportViewToJPG(data);
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
        init : init
    }
}(_config));

myApp.init();