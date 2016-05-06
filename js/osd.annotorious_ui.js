
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
    buttons_div[0].style.width="80px";
  }
  // add the focus-click eye button
  var popup_div = document.getElementsByClassName('annotorious-popup');
  if(popup_div) { // first one
    var b_node = document.createElement('a');
    b_node.classList.add("annotorious-popup-button");
    b_node.classList.add("annotorious-popup-button-click");
    b_node.title="Focus";
    b_node.onclick = function(){ annoClickAnnotation(null); };
    b_node.name="Focus";
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
    data.map(function(annotation) {
        annotation = convertToAnnotation(annotation);
        annotationsToLoad.annoList.push(annotation);
    });
    readAll(annotationsToLoad);
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
                var annotation = convertToAnnotation(data);
                annotation = annoRetrieveByHash(getHash(annotation));
                annotation.text = data.text;
                updateAnnotationDOMWithStyle(annotation);
                break;
            case 'deleteAnnotation':
                var annotation = convertToAnnotation(data);
                annotation = annoRetrieveByHash(getHash(annotation));
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

// Converts an ERMrest/Chaise annotation entity into an Annotorious annotation
function convertToAnnotation(_annotation) {
    console.log(_annotation);
    var annotationText = '';
    var annotationStyle = {};
    if (_annotation.anatomy) {
        annotationText = '<strong>' + capitalizeFirstLetter(_annotation.anatomy) + '</strong><br>';
    }
    if (_annotation.description) {
        annotationText += _annotation.description;
    }
    // All new Chaise annotations should have a config now, but perserve this check
    // for older annotations without a config
    if (_annotation.config) {
        annotationStyle = _annotation.config;
    }

    if (_annotation.type == 'arrow') {
        annotationStyle.displayType = 'marker';
        annotationStyle.marker = {
            'class': 'glyphicon-tag',
            'color': _annotation.config.color,
            'font': '24px'
        };
    } else {
        annotationStyle.displayType = 'visible';
    }

    if (_annotation.type == 'section') {
        annotationStyle.special = {'borderColor': 'green'};
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
