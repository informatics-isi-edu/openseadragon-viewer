
/* event/message linkup with chaise */

// A flag to track whether OpenSeadragon/Annotorious is
// being used inside another window (i.e. Chaise), set enableEmbedded.

var enableEmbedded = false;
if (window.self !== window.top) {
    enableEmbedded = true;
}

/* from annotorious.js
annotorious.templates.popup = function(opt_data) {
  return '<div class="annotorious-popup top-left" style="position:absolute;z-index:1"><div class="annotorious-popup-buttons" ><a class="annotorious-popup-button annotorious-popup-button-edit" title="Edit" href="javascript:void(0);">EDIT</a><a class="annotorious-popup-button annotorious-popup-button-delete" title="Delete" href="javascript:void(0);">DELETE</a></div><span class="annotorious-popup-text"></span></div>'; }
*/

function setupAnnoUI() {
  // widen the popup buttons' space
  var buttons_div = document.getElementsByClassName('annotorious-popup-buttons');
  if(buttons_div) { // first one
    buttons_div[0].style.width="80px";
  }
  // add the focus-click eye button
  var popup_div = document.getElementsByClassName('annotorious-popup');
  if(popup_div) { // first one
    var b_node = document.createElement('a');
    b_node.classList.add("annotorious-popup-button");
    b_node.classList.add("annotorious-popup-button-click");
    b_node.title="Click";
    b_node.onclick = function(){ annoClickAnnotation(null); };
    b_node.name="CLICK";
    popup_div[0].insertBefore(b_node, popup_div[0].lastChild);
  }

  if(!enableEmbedded) {
      /* enable control and annotations buttons */
      var bElm = document.getElementById('osd-control-panel');
      if(bElm)
        bElm.style.display = '';
      } else {
        // Hide the annotation editor aka the black box. Editing will occur in Chaise.
        var styleSheet = document.styleSheets[document.styleSheets.length-1];
        styleSheet.insertRule('.annotorious-editor { display:none }', 0);
        styleSheet.insertRule('.annotorious-popup-button-edit { visibility:hidden }', 0);
        styleSheet.insertRule('.annotorious-popup-button-delete { visibility:hidden }', 0);
  }
}


/*********************************************************/
// post outgoing message events to Chaise,
/*********************************************************/
function updateAnnotationList(mType, cData) {
    if (enableEmbedded) {
        window.top.postMessage({messageType: mType, content: cData}, window.location.origin);
    } else {
        if(mType == 'onHighlighted') {
            var t=JSON.parse(cData);
            var item=t.data
            colorAnnoListItem(item,1);
            return;
        }
        if(mType == 'onUnHighlighted') {
            var t=JSON.parse(cData);
            var item=t.data
            colorAnnoListItem(item,0);
            return;
        }
        if(mType == 'onClickAnnotation') {
            /* ignore this, for Chaise only */
            return;
        }
        if(mType == 'annotationDrawn') {
            /* ignore this, for Chaise only */
            return;
        }
        if(mType == 'onInViewAnnotations') {
            /* ignore this, for Chaise only */
window.console.log("IN HERE...");
            return;
        }
        // other ones affects the annotation_list entry
        //'onAnnotationCreated',
        //'onAnnotationRemoved',
        //'onAnnotationUpdated'
        updateAnnotations();
    }
}

function updateAnnotationState(mType, cState) {
    if (enableEmbedded) {
        window.top.postMessage({messageType: mType, content: cState}, window.location.origin);
    }
}

function uploadAnnotationList(mType, cState) {
    if (enableEmbedded) {
        window.top.postMessage({messageType: mType, content: cState}, window.location.origin);
    }
}

function event_loadAnnotations(messageType, data) {
    var annotationsToLoad = {"annoList":[]};
    data.map(function formatAnnotationObj(annotation) {
        annotation = annotation.data;
        var heading = '';
        if (annotation.anatomy) {
            heading = '<strong>' + capitalizeFirstLetter(annotation.anatomy) + '</strong><br>';
        }
        var annotationObj = {
            "type": "openseadragon_dzi",
            "id": null,
            "event": "INFO",
            "data": {
                "src": "dzi://openseadragon/something",
                "text": heading + annotation.description,
                "shapes": [
                    {
                "type": "rect",
                "geometry": {
                    "x": annotation.coords[0],
                    "y": annotation.coords[1],
                    "width": annotation.coords[2],
                    "height": annotation.coords[3]
                },
                "style": {}
                    }
                ],
                "context": annotation.context_uri 
            }
        };
        if (annotation.config) {
            annotationObj.data.shapes[0].style = annotation.config;
        }
        annotationsToLoad.annoList.push(annotationObj);
    });
    readAll(annotationsToLoad);
}

function event_createAnnotation(messageType, data) {
    cancelEditor();
    var heading = '';
    var style = {};

    if (data.anatomy) {
        heading = '<strong>' + capitalizeFirstLetter(data.anatomy) + '</strong><br>';
    }

    var annotationObj = {
        "type": "openseadragon_dzi",
        "id": null,
        "event": "INFO",
        "data": {
            "src": "dzi://openseadragon/something",
            "text": heading + data.description,
            "shapes": [
                {
                    "type": "rect",
                    "geometry": {
                        "x": data.coords[0],
                        "y": data.coords[1],
                        "width": data.coords[2],
                        "height": data.coords[3]
                    },
                    "style": {}
                }
            ],
            "context": data.context_uri
        }
    };

    if (data.config) {
        annotationObj.data.shapes[0].style = data.config;
    }
    annoAdd(annotationObj.data);
}

/*********************************************************/
// An event listener to capture incoming messages from Chaise
/*********************************************************/
window.addEventListener('message', function(event) {
    if (event.origin === window.location.origin) {
        var messageType = event.data.messageType;
        var data = event.data.content;
        switch (messageType) {
            case 'zoomInView':
                zoomInClick();
                break;
            case 'zoomOutView':
                zoomOutClick();
                break;
            case 'homeView':
                homeClick();
                break;
            case 'fullPageView':
                fullPageClick();
                break;
            case 'downloadView':
                jpgClick(data+".jpg");
                break;
            case 'loadArrowAnnotations':
                markArrow();
                event_loadAnnotations(messageType, data);
                unmarkArrow();
                break;
            case 'loadSpecialAnnotations':
                markSpecial();
                event_loadAnnotations(messageType, data);
                unmarkSpecial();
                break;
            case 'loadAnnotations':
                event_loadAnnotations(messageType, data);
                break;
            case 'centerAnnotation':
                var heading = '';
                if (data.anatomy) {
                    heading = '<strong>' + capitalizeFirstLetter(data.anatomy) + '</strong><br>';
                }
                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": heading + data.description,
                    "shapes": [
                        {
                            "type": "rect",
                            "geometry": {
                                "x": data.coords[0],
                                "y": data.coords[1],
                                "width": data.coords[2],
                                "height": data.coords[3]
                            },
                            "style": {}
                        }
                    ],
                    "context": data.context_uri
                };

                if (data.config) {
                    annotationObj.shapes[0].style = data.config;
                }

                centerAnnoByHash(getHash(annotationObj),true);
                break;
            case 'highlightAnnotation':
                var heading = '';
                if (data.anatomy) {
                    heading = '<strong>' + capitalizeFirstLetter(data.anatomy) + '</strong><br>';
                }
                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": heading + data.description,
                    "shapes": [
                        {
                            "type": "rect",
                            "geometry": {
                                "x": data.coords[0],
                                "y": data.coords[1],
                                "width": data.coords[2],
                                "height": data.coords[3]
                            },
                            "style": {}
                        }
                    ],
                    "context": data.context_uri
                };
                if (data.config) {
                    annotationObj.shapes[0].style = data.config;
                }
                highlightAnnoByHash(getHash(annotationObj));
                break;
            case 'unHighlightAnnotation':
                annoUnHighlightAnnotation(null);
                break;
            case 'drawAnnotation':
                myAnno.activateSelector();
                break;
            case 'createArrowAnnotation':
                markArrow();
                event_createAnnotation(messageType, data);
                unmarkArrow();
                break;
            case 'createSpecialAnnotation':
                markSpecial();
                event_createAnnotation(messageType, data);
                unmarkSpecial();
                break;
            case 'createAnnotation':
                event_createAnnotation(messageType, data);
                break;
            case 'cancelAnnotationCreation':
                cancelEditor();
                break;
            case 'updateAnnotation':
                var heading = '';
                if (data.anatomy) {
                    heading = '<strong>' + capitalizeFirstLetter(data.anatomy) + '</strong><br>';
                }
                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": heading + data.description,
                    "shapes": [
                        {
                            "type": "rect",
                            "geometry": {
                                "x": data.coords[0],
                                "y": data.coords[1],
                                "width": data.coords[2],
                                "height": data.coords[3]
                            },
                            "style": {}
                        }
                    ],
                    "context": data.context_uri
                };
                var annotation = annoRetrieveByHash(getHash(annotationObj));
                annotation.text = annotationObj.text;
                if (data.config) {
                    annotation.shapes[0].style = data.config;
                }
                break;
            case 'deleteAnnotation':
                var heading = '';
                if (data.anatomy) {
                    heading = '<strong>' + capitalizeFirstLetter(data.anatomy) + '</strong><br>';
                }

                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": heading + data.description,
                    "shapes": [
                        {
                            "type": "rect",
                            "geometry": {
                                "x": data.coords[0],
                                "y": data.coords[1],
                                "width": data.coords[2],
                                "height": data.coords[3]
                            },
                            "style": {}
                        }
                    ],
                    "context": data.context_uri
                };

                if (data.config) {
                    annotationObj.shapes[0].style = data.config;
                }

                var annotation = annoRetrieveByHash(getHash(annotationObj));
                myAnno.removeAnnotation(annotation);
                break;
            default:
                console.log('Invalid message type. No action performed. Received message event: ', event);
        }
    } else {
        console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
    }
});

/*********************************************************/
// Utilities
/*********************************************************/

function capitalizeFirstLetter(string) {
    if (typeof string === 'string') {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return string;
}
