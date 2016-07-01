
//   overlay-annotation-outer  (includes the marker)
//   overlay-annotation-inner  (includes the marker)
//
//    style: { displayType: [Marker|Border|Hidden],
//             annoType: [ Place | Shape ],
//             special: { borderColor: 'green' },
//             marker:{ class: 'glyphicon-tag',
//                      color: 'red',
//                      font: '24px'
//                    }
//           }
//
// from https://groups.google.com/forum/#!topic/annotorious/WqrcF6Y36gA
//  style : {
//      fill: '#E5CCFF',
//      hi_fill: '#E5CCFF',
//      stroke: '#E5CCFF',
//      hi_stroke: '#E5CCFF',
//      outline: '#E5CCFF',
//      hi_outline: '#E5CCFF',
//      Ce: 2, //outline_width
//      xe: 2, //hi_outline_width
//      Ee: 1, //stroke_width
//      ye: 1 //hi_stroke_width
//  } 
//

var MEI_TEST=false;

var S_ATYPE='annoType';
var S_ATYPE_PLACE='place';
var S_ATYPE_SHAPE='shape';
var S_DTYPE='displayType';
var S_DTYPE_BORDER='border';
var S_DTYPE_MARKER='marker';
var S_DTYPE_HIDDEN='hidden';
var S_DTYPE_DEFAULT=S_DTYPE_BORDER;
var S_ATYPE_DEFAULT=S_ATYPE_SHAPE;
var S_MARKER='marker';
var S_MARKER_CLASS='class';
var S_MARKER_CLASS_DEFAULT='glyphicon-tag';
var S_MARKER_CLASS_FAT='glyphicon-star';
var S_MARKER_COLOR='color';
var S_MARKER_COLOR_DEFAULT='red';
var S_MARKER_FONT='font';
var S_MARKER_FONT_DEFAULT='24px';
var S_SPECIAL='special';
var S_SPECIAL_BORDER='borderColor';
var S_SPECIAL_BORDER_DEFAULT='green';

var initialStyle= { 'displayType': S_DTYPE_DEFAULT,
                    'annoType':S_ATYPE_DEFAULT,
                    'marker':{ 'class': S_MARKER_CLASS_DEFAULT,
                               'color': S_MARKER_COLOR_DEFAULT,
                               'font': S_MARKER_FONT_DEFAULT }
                  };
var initialSpecial = { 'special': {'borderColor': S_SPECIAL_BORDER_DEFAULT} };
var initialMarker = { 'class': S_MARKER_CLASS_DEFAULT,
                      'color': S_MARKER_COLOR_DEFAULT,
                      'font': S_MARKER_FONT_DEFAULT };

var defaultStyle= {
     'fill': '#E5CCFF',
     'hi_fill': '#E5CCFF',
     'stroke': '#E5CCFF',
     'hi_stroke': '#E5CCFF',
     'outline': '#E5CCFF',
     'hi_outline': '#E5CCFF',
     'outline_width': 2, //outline_width
     'hi_outline_width': 2, //hi_outline_width
     'stroke_width': 1, //stroke_width
     'hi_stroke_width': 1 //hi_stroke_width 
}; 

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
  if(item == null)
    window.console.log("BAD BAD setup..");
  var style=item.shapes[0].style;
  if(!isObjEmpty(style)) { /* there is style information already */
    // fill in missing ones if necessary
    if(style['displayType']==null) { //required
      style['displayType']=S_DTYPE_DEFAULT;
    }
    if(style['annoType']==null) { // required
      style['annoType']=S_ATYPE_DEFAULT;
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

function updateMarkerWithText(item,text) {
  var anno_id=makeAnnoID(item);
  var anno_div = document.getElementById(anno_id); // boxmarker-outer
  var marker_node = anno_div.childNodes[1]; // marker
  var tooltip_node = marker_node.childNodes[0]; // marker's tooltip
  tooltip_node.innerText=text; 
  if(parseInt(text) > 1) {
    marker_node.classList.remove(S_MARKER_CLASS_DEFAULT);
    marker_node.classList.add(S_MARKER_CLASS_FAT);
    } else {
      marker_node.classList.add(S_MARKER_CLASS_DEFAULT);
      marker_node.classList.remove(S_MARKER_CLASS_FAT);
  }
}

function getMarkerUserDefinedSize(markerObj) {
  var hash=trimAnnoID(trimMarkerID(markerObj.id));
  var anno=annoRetrieveByHash(hash);
  var font=anno.shapes[0].style['marker']['font'];
  if(font)
    return font;
  return "24px";
}

function processMarkerSize(markerObj) {
  var currentZoom=myViewer.viewport.getZoom(true);
  var maxZoom=myViewer.viewport.getMaxZoom();
  var minZoom=myViewer.viewport.getMinZoom();
//window.console.log("maxZoom ",maxZoom," minZoom ",minZoom, " currentZoom ",currentZoom);
  // zoom in, use big fontSize
  // zoom out, use small fontSize and a star
  // separate into 3 parts, 1/4, 1/2, 1/4, min-mid1-mid2-max
  var step=Math.round((maxZoom-minZoom )/4);

  if(markerObj.classList.contains("glyphicon-bigger"))
    markerObj.classList.remove("glyphicon-bigger");
  if(markerObj.classList.contains("glyphicon-smaller"))
    markerObj.classList.remove("glyphicon-smaller");
  markerObj.style.fontSize="";
  markerObj.style.top="40%";
  markerObj.style.left="40%";

  if (currentZoom < minZoom + step) {
    markerObj.classList.add("glyphicon-smaller");
//    markerObj.style.top="0";
//    markerObj.style.left="0";
    return;
  }
  if (currentZoom < minZoom + (step * 3)) {
    // user use specified size
    var fontSize=getMarkerUserDefinedSize(markerObj);
    markerObj.style.fontSize=fontSize; 
    return;
  }  
  markerObj.classList.add("glyphicon-bigger");
}

// given a style, edit the DOM according to style
function updateAnnotationDOMWithStyle(item) {

  var style=item.shapes[0].style;
  var anno_id=makeAnnoID(item);
  var anno_div = document.getElementById(anno_id); // boxmarker-outer
  var inner_node = anno_div.childNodes[0]; // boxmarker-inner
  var marker_node = anno_div.childNodes[1]; // marker

  if(isObjEmpty(style)) {
    style=setupStyleForAnnotation(item);
  }

  var _font;
  var _class;
  var _color;

if(MEI_TEST) {
  _font='24px';
  _class='glyphicon-tag';
  _color='yellow';
} else {
  // using marker info
  _font=style['marker']['font'];
  _class=style['marker']['class'];
  _color=style['marker']['color'];
}

//XX  anno_div.style.borderColor=_color;
  marker_node.classList.add("glyphicon");
  marker_node.classList.add(_class);
  marker_node.style.color=_color;
  marker_node.style.fontSize=_font;

// special processing when the zoom level is different..

  //if there is a special style
  if(style['special']) {
    anno_div.style.borderColor=style['special']['borderColor'];
  }

  processMarkerSize(marker_node,_font);
  updateAnnotationDisplay(item);
}

function updateAnnotationDisplay(item) {
  var style=item.shapes[0].style;
  switch(style['displayType']) {
    case S_DTYPE_BORDER:
      enableBorderState(item);
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


function updateSpecial2Style(item,_bcolor) {
  var style=item.shapes[0].style;
  if(isObjEmpty(style)) {
    style=setupStyleForAnnotaiton(item);
  }

  if(style['special'] == null) {
    item.shapes[0].style['special']=cloneIt(initialSpecial);
  }

  item.shapes[0].style['special']['borderColor']=_bcolor;
}

function updateMarker2Style(item,_class,_color,_font) {
  var style=item.shapes[0].style;
  if(isObjEmpty(style)) {
    style=setupStyleForAnnotation(item);
  }
  if(_font)
    item.shapes[0].style['marker']['font']=_font;
  if(_color)
    item.shapes[0].style['marker']['color']=_color;
  if(_class)
    item.shapes[0].style['marker']['class']=_class;
}

function updateStyle2Default(item) {
   item.shapes[0].style={};

   item.shapes[0].style['fill']='#E5CCFF';
   item.shapes[0].style['hi_fill']='#E5CCFF';
   item.shapes[0].style['stroke']='#E5CCFF';
   item.shapes[0].style['hi_stroke']='#E5CCFF';
   item.shapes[0].style['outline']='#E5CCFF';
   item.shapes[0].style['hi_outline']='#E5CCFF';
   item.shapes[0].style['outline_width']=2;
   item.shapes[0].style['hi_outline_width']=2;
   item.shapes[0].style['stroke_width']=1;
   item.shapes[0].style['hi_stroke_width']=1;
}

function updateDisplayType2Style(item,_dtype) {
  var style=item.shapes[0].style;
  if(isObjEmpty(style)) {
    style=setupStyleForAnnotation(item);
  }
  item.shapes[0].style['displayType']=_dtype;
}

function isSpecialAnnotationType(item) {
  var rc=(item.shapes[0].style['special'] != null);
  return rc;
}
