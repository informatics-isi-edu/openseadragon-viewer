
/* event/message linkup with chaise */

// A flag to track whether OpenSeadragon/Annotorious is
// being used inside another window (i.e. Chaise), set enableEmbedded.

var enableEmbedded = false;
if (window.self !== window.top) {
    enableEmbedded = true;
}

/* from annotorious.js
annotorious.templates.popup = function(opt_data) {
  return '<div class="annotorious-popup top-left" style="position:absolute;z-index:1"><div class="annotorious-popup-buttons" ><a class="annotorious-popup-button annotorious-popup-button-edit" title="Edit" href="javascript:void(0);">EDIT</a><a class="annotorious-popup-button annotorious-popup-button-delete" title="Delete" href="javascript:void(0);">DELETE</a></div><span class="annotorious-popup-text"></span></div>';
*/
function setupAnnoUI() {
  if(!enableEmbedded) {
      /* enable control and annotations buttons */
      var bElm = document.getElementById('ctrl-button');
      if(bElm)
        bElm.style.display = '';
      bElm = document.getElementById('jpg-ctrl-button');
      if(bElm) {
        bElm.style.display = '';
      }
      bElm = document.getElementById('anno-ctrl-button');
      if(bElm)
        bElm.style.display = '';
      bElm = document.getElementById('anno-button');
      if(bElm)
        bElm.style.display = '';
      } else {
        // Hide the annotation editor aka the black box.
        // Editing will occur in Chaise.
        var styleSheet = document.styleSheets[document.styleSheets.length-1];
        styleSheet.insertRule('.annotorious-editor { display:none }', 0);
        styleSheet.insertRule('.annotorious-popup-buttons { visibility:hidden }', 0);
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
            var h=getHash(item);
            colorAnnoListItem(h,1);
            return;
        }
        if(mType == 'onUnHighlighted') {
            var t=JSON.parse(cData);
            var item=t.data
            var h=getHash(item);
            colorAnnoListItem(h,0);
            return;
        }
        if(mType == 'annotationDrawn') {
            /* ignore this, specific for Chaise only */
            return;
        }
        updateAnnotations();
    }
}

function updateAnnotationState(mType, cState) {
    if (enableEmbedded) {
        window.top.postMessage({messageType: mType, content: cState}, window.location.origin);
    }
}

/*********************************************************/
// An event listener to capture incoming messages from Chaise
/*********************************************************/
window.addEventListener('message', function(event) {
    if (event.origin === window.location.origin) {
        var messageType = event.data.messageType;
        var data = event.data.content;
        switch (messageType) {
            case 'loadAnnotations':
                var annotationsToLoad = {"annoList":[]};
                data.map(function formatAnnotationObj(annotation) {
                    annotation = annotation.data;
                    var annotationObj = {
                        "type": "openseadragon_dzi",
                        "id": null,
                        "event": "INFO",
                        "data": {
                            "src": "dzi://openseadragon/something",
                            "text": annotation.description,
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
                    annotationsToLoad.annoList.push(annotationObj);
                });
                readAll(annotationsToLoad);
                break;
            case 'highlightAnnotation':
                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": data.description,
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
                highlightAnnoByHash(getHash(annotationObj));
                break;
            case 'unHighlightAnnotation':
                annoUnHighlightAnnotation(null);
                break;
            case 'highlightAnnotation':
                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": data.comments,
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
                annoHighlightAnnotation(annotationObj);
                break;
            case 'drawAnnotation':
                myAnno.activateSelector();
                break;
            case 'createAnnotation':
                cancelEditor();
                var annotationObj = {
                    "type": "openseadragon_dzi",
                    "id": null,
                    "event": "INFO",
                    "data": {
                        "src": "dzi://openseadragon/something",
                        "text": data.description,
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
                annoAdd(annotationObj.data);
                break;
            case 'cancelAnnotationCreation':
                cancelEditor();
                break;
            case 'updateAnnotation':
                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": data.description,
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
                break;
            case 'deleteAnnotation':
                var annotationObj = {
                    "src": "dzi://openseadragon/something",
                    "text": data.description,
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
                myAnno.removeAnnotation(annotation);
                break;
            default:
                console.log('Invalid message type. No action performed. Received message event: ', event);
        }
    } else {
        console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
    }
});
