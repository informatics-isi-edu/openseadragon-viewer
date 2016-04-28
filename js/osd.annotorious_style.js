
//   overlay-annotation-outer  (includes the marker)
//   overlay-annotation-inner  (includes the marker)

//
//    style: { displayType: [marker|visible|hidden],
//             special: { border: 3px solid green },
//             marker:{ url: 'glyphicon-tag',
//                      color: 'red',
//                      font: '24px'
//                    } 
//           }
//          
//
var S_DTYPE='displayType';
var S_DTYPE_VISIBLE='visible';
var S_DTYPE_HIDDEN='hidden';
var S_DTYPE_MARKER='marker';
var S_DTYPE_DEFAULT=S_DTYPE_VISIBLE;
var S_MARKER='marker';
var S_MARKER_URL='url';
var S_MARKER_URL_DEFAULT='glyphicon-tag';
var S_MARKER_COLOR='color';
var S_MARKER_COLOR_DEFAULT='red';
var S_MARKER_FONT='font';
var S_MARKER_FONT_DEFAULT='24px';
var S_SPECIAL='special';
var S_SPECIAL_BORDER='border';
var S_SPECIAL_BORDER_DEFAULT='2px solid green';

var initialStyle= { 'displayType': S_DTYPE_DEFAULT,
                    'marker':{ 'url': S_MARKER_URL_DEFAULT,
                               'color': S_MARKER_COLOR_DEFAULT,
                               'font': S_MARKER_FONT_DEFAULT } 
                  };
var initialSpecial = { 'special': {'border': S_SPECIAL_BORDER_DEFAULT} };
var initialMarker = { 'marker':{ 'url': S_MARKER_URL_DEFAULT,
                                 'color': S_MARKER_COLOR_DEFAULT,
                                 'font': S_MARKER_FONT_DEFAULT }};

// only one of the style object
function cloneIt(obj) {
  var cloned = JSON.parse(JSON.stringify(obj));
  return cloned;
};

function isObjEmpty(obj) {
  var rc=(Object.keys(obj).length === 0 && 
               JSON.stringify(obj) === JSON.stringify({}));
  return rc;
}

function setupStyleForAnnotation(item) {
  var style=item.shapes[0].style;
  if(!isObjEmpty(style)) { /* there is style information already */
    // fill in missing ones if necessary
    if(style['displayType']==null) { //required
      style['displayType']=S_DTYPE_DEFAULT;
    }
    if(style['marker']==null) { // required
      style['marker']=cloneIt(initialMarker);
    }
    item.shapes[0].style=style;
    } else { 
      item.shapes[0].style=cloneIt(initialStyle);
  }
  return item.shapes[0].style;
}

function setStyleIntoAnnotation(item,style)
{
  item.shapes[0].style=style;
}


// given a style, edit the DOM
function updateAnnotationDOMWithStyle(item) {
  var style=item.shapes[0].style;
  var anno_id=makeAnnoID(item);
  var anno_div = document.getElementById(anno_id); // boxmarker-outer
  var inner_node = anno_div.childNodes[0]; // boxmarker-inner
  var marker_node = anno_div.childNodes[1]; // marker

  if(isObjEmpty(style)) { 
    style=setupStyleForAnnotation(item);
  }

  // using marker info
  var _font=style['marker']['font'];
  var _url=style['marker']['url'];
  var _color=style['marker']['color'];

  anno_div.style.borderColor=_color;
  marker_node.style.font=_font;
  marker_node.classList.add("glyphicon");
  marker_node.classList.add(_url);
  marker_node.style.color=_color;

  //if there is a special style 
  if(style['special']) {
    anno_div.style.border=style['special']['border'];
  }
  updateAnnotationDisplay(item);
}

function updateAnnotationDisplay(item) {
  var style=item.shapes[0].style;
  switch(style['displayType']) {
    case S_DTYPE_VISIBLE:
      disableMarkerState(item);
      break;
    case S_DTYPE_HIDDEN:
      enableHiddenState(item);
      break;
    case S_DTYPE_MARKER:
      enableMarkerState(item);
      break;
    default:
      window.console.log("hum.. bad updateAnnotationDisplay");
      break;
  }
}


function updateSpecial2Style(item,border) {
  var style=item.shapes[0].style;
  if(isObjEmpty(style)) { 
    style=setupStyleForAnnotation(item);
  }
  if(style['special'] == null) {
    item.shapes[0].style['special']=cloneIt(initialSpecial);
  } 
  item.shapes[0].style['special']['border']=border;
}

function updateMarker2Style(item,url,color,font) {
  var style=item.shapes[0].style;
  if(isObjEmpty(style)) { 
    style=setupStyleForAnnotation(item);
  }
  if(font)
    item.shapes[0].style['marker']['font']=font;
  if(color)
    item.shapes[0].style['marker']['color']=color;
  if(url)
    item.shapes[0].style['marker']['url']=url;
}

function updateDisplayType2Style(item,dtype) {
  var style=item.shapes[0].style;
  if(isObjEmpty(style)) { 
    style=setupStyleForAnnotation(item);
  }
  item.shapes[0].style['displayType']=dtype;
}
