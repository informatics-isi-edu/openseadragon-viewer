
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
  // widen the popup buttons' space to allow space for the focus-eye
  var buttons_div = document.getElementsByClassName('annotorious-popup-buttons');
  if(buttons_div) { // first one
    buttons_div[0].style.width="140px";
  }
  // add the focus-click eye button
  var popup_div = document.getElementsByClassName('annotorious-popup');
  var buttons_div = document.getElementsByClassName('annotorious-popup-buttons');
  if(popup_div) { // first one
    var b_node = document.createElement('a');
    b_node.classList.add("annotorious-popup-button-click");
    b_node.classList.add("glyphicon");
    b_node.classList.add("glyphicon-eye-open");
    b_node.title="Focus";
    b_node.onclick = function(){ annoClickAnnotation(null); };
    b_node.name="Focus";
    popup_div[0].insertBefore(b_node, popup_div[0].lastChild);

    // add the invisible-click zap button
    var bb_node = document.createElement('a');
    bb_node.classList.add("annotorious-popup-button-zap");
    bb_node.classList.add("glyphicon");
    bb_node.classList.add("glyphicon-remove-circle");
    bb_node.title="Zap";
    bb_node.onclick = function(){ annoZapAnnotation(null); };
    bb_node.name="Zap";
    popup_div[0].insertBefore(bb_node, popup_div[0].lastChild);
  }

  var buttons_div = document.getElementsByClassName('annotorious-popup-buttons');
  if(buttons_div) {
    // add the marking-click mark button
    var bbb_node = document.createElement('a');
    bbb_node.classList.add("annotorious-popup-button-mark");
    bbb_node.classList.add("glyphicon");
    bbb_node.classList.add("glyphicon-flag");
    bbb_node.title="Marker";
    bbb_node.onclick = function(){ annoMarkAnnotation(null); };
    bbb_node.name="Marker";
    buttons_div[0].insertBefore(bbb_node, buttons_div[0].lastChild);
  }

  if(!enableEmbedded) {
      /* enable control and annotations buttons */
//      var bElm = document.getElementById('osd-control-panel');
      var bElm = document.getElementById('osd-control-panel-test');
      if(bElm)
        bElm.style.display = '';
      } else {
        // Hide the annotation editor aka the black box. Editing will occur in Chaise.
        var styleSheet = document.styleSheets[document.styleSheets.length-1];
        styleSheet.insertRule('.annotorious-editor { display:none }', 0);
        styleSheet.insertRule('.annotorious-popup-button-edit { visibility:hidden }', 0);
        styleSheet.insertRule('.annotorious-popup-button-delete { visibility:hidden }', 0);
        styleSheet.insertRule('.annotorious-popup-button-mark { visibility:hidden }', 0);
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
            var item=JSON.parse(cData);
            colorAnnoListItem(item,1);
            return;
        }
        if(mType == 'onUnHighlighted') {
            var item=JSON.parse(cData);
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

// save the propertyList to the backend
function uploadFilteringPropertyList(mType, pData) {
    if (enableEmbedded) {
        window.top.postMessage({messageType: mType, content: pData}, window.location.origin);
    }
}

function event_loadAnnotations(messageType, data) {
    var annotationsToLoad = {"annoList":[]};
    data.map(function(annotation) {
        annotation = convertToAnnotation(annotation);
        annotationsToLoad.annoList.push(annotation);
    });
    readAll(annotationsToLoad);
}

function event_loadFilteringPropertyList(messageType, data) {
    var propertyToLoad = [];
    data.map(function(item) {
        var p=JSON.parse(item);
        propertyToLoad.push(p);
    });
    loadPropertyList(propertyToLoad);
}


function event_createAnnotation(messageType, data) {
    var annotation = convertToAnnotation(data);
    cancelEditor();
    annoAdd(annotation);
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
            case 'loadAnnotations':
                event_loadAnnotations(messageType, data);
                break;
            case 'centerAnnotation':
                var annotation = convertToAnnotation(data);
                centerAnnoByHash(getHash(annotation),true);
                break;
            case 'highlightAnnotation':
                var annotation = convertToAnnotation(data);
                highlightAnnoByHash(getHash(annotation));
                break;
            case 'unHighlightAnnotation':
                annoUnHighlightAnnotation(null);
                break;
            case 'syncVisibility':
                for (var i = 0, len = data.length; i < len; i++) {
                    var annotation = convertToAnnotation(data[i]);
                    var existingAnnotation = 
                      annoRetrieveByHash(getHash(annotation));
                    existingAnnotation.shapes = annotation.shapes;
                    updateAnnotationDOMWithStyle(annotation);
                }
                break;
            case 'hideAllAnnotations':
                annoHideAllAnnotations();
                break;
            case 'showAllAnnotations':
                annoShowAllAnnotations();
                break;
            case 'drawAnnotation':
                myAnno.activateSelector();
                break;
            case 'createAnnotation':
                event_createAnnotation(messageType, data);
                break;
            case 'cancelAnnotationCreation':
                cancelEditor();
                break;
            case 'updateAnnotation':
                var newAnnotationData = convertToAnnotation(data);
                var existingAnnotation = annoRetrieveByHash(getHash(newAnnotationData));
                existingAnnotation.text = newAnnotationData.text;
                existingAnnotation.shapes = newAnnotationData.shapes;
                updateAnnotationDOMWithStyle(newAnnotationData);
                break;
            case 'deleteAnnotation':
                var annotation = convertToAnnotation(data);
                annotation = annoRetrieveByHash(getHash(annotation));
                myAnno.removeAnnotation(annotation);
                break;
// for image filtering
            case 'loadFilteringPropertyList':
                event_loadFilteringPropertyList(messageType, data);
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

// Converts an ERMrest/Chaise annotation entity into an Annotorious annotation
// var S_DTYPE='displayType';
// var S_DTYPE_BORDER='border';
// var S_DTYPE_HIDDEN='hidden';
// var S_DTYPE_MARKER='marker';
// var S_DTYPE_DEFAULT=S_DTYPE_BORDER;
// var S_MARKER='marker';
// var S_MARKER_CLASS='class';
// var S_MARKER_CLASS_DEFAULT='glyphicon-tag';
// var S_MARKER_CLASS_FAT='glyphicon-star';
// var S_MARKER_COLOR='color';
// var S_MARKER_COLOR_DEFAULT='red';
// var S_MARKER_FONT='font';
// var S_MARKER_FONT_DEFAULT='24px';
// var S_SPECIAL='special';
// var S_SPECIAL_BORDER='borderColor';
// var S_SPECIAL_BORDER_DEFAULT='green';
function convertToAnnotation(_annotation) {
    var annotationText = '';
    var annotationStyle = {
        displayType: S_DTYPE_BORDER,
        marker: {
            class: S_MARKER_CLASS_DEFAULT,
            color: S_MARKER_COLOR_DEFAULT,
            font: S_MARKER_FONT_DEFAULT
        }
    };
    if (_annotation.anatomy) {
        annotationText = '<strong>' + capitalizeFirstLetter(_annotation.anatomy) + '</strong><br>';
    }
    if (_annotation.description) {
        annotationText += _annotation.description;
    }

    if (_annotation.type == 'arrow') {
        annotationStyle.displayType = S_DTYPE_MARKER;
    } else if (_annotation.type == 'section') {
        if (!annotationStyle.special) {
            annotationStyle.special = {};
        }
        annotationStyle.special[S_SPECIAL_BORDER] = S_SPECIAL_BORDER_DEFAULT;
    }

    // All new Chaise annotations should have a config now, but perserve this check
    // for older annotations without a config
    // Default _annotation.config structure: {color: 'whatever the default color is in Chaise'}
    if (_annotation.config) {
        annotationStyle.marker.color = _annotation.config.color;
        if (_annotation.config.visible == false) {
            annotationStyle.displayType = S_DTYPE_HIDDEN;
        }
    }

    var annotation = {
        "src": "dzi://openseadragon/something",
        "text": annotationText,
        "shapes": [
            {
                "type": "rect",
                "geometry": {
                    "x": _annotation.coords[0],
                    "y": _annotation.coords[1],
                    "width": _annotation.coords[2],
                    "height": _annotation.coords[3]
                },
                "style": annotationStyle
            }
        ],
        "context": _annotation.context_uri
    };
    return annotation;
}
