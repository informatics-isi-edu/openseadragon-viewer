/* functions related to annotorious */
var myAnnoReady = false;
var myAnno=null;
var saveCurrentHighlightAnnotation=null;

var CREATE_EVENT_TYPE='CREATE';
var UPDATE_EVENT_TYPE='UPDATE';
var REMOVE_EVENT_TYPE='REMOVE';
var CLICK_EVENT_TYPE='CLICK';
var INFO_EVENT_TYPE='INFO';

// this is for saveAnno and loadAnno buttons that
// do localhost dump and loading -- in standalone mode
var TEST_MODE=false;

function makeAnnoID(item) {
  var id='anno_'+getHash(item);
  return id;
}

// This is to make a temporary annotation id
// with just location information
// needs to be replaced later with a full annotation id
// this is to work around annotorious' updates that
// 'replaces' the DOM instead of rewriting it
function makeAnnoIDWithLocation(location)
{
  var id='tanno_'+getHashWithLocation(location);
  return id;
}

function makeMarkerID(annoID) {
  var id='arrow_'+annoID;
  return id;
}

// trim marker id back into annotation id
function trimMarkerID(markerID) {
  var annoID=markerID.replace("arrow_","");
  return annoID;
}
// trim Annotation's id into hash value
function trimAnnoID(annoID) {
  var hashValue=annoID.replace("anno_","");
  return hashValue;
}

// temporary annotation id, see makeAnnoIDWithLocation
function makeMarkerIDWithLocation(location)
{
  var id='tarrow_'+makeAnnoIDWithLocation(location);
  return id;
}

function makeAnnoListID(item) {
//  var id='alist_'+getHash(item);
  var id=getHash(item);
  return id;
}

// when there is a zooming change, the size of Marker
// might need to be adjusted
function annoResizeMarkers() {
  var markers = document.getElementsByClassName('annotation-marker');
  var len = markers.length;
  for (var i = 0; i < len; i++) {
     var markerObj=markers[i];
     processMarkerSize(markerObj);
  }
}

function annoCtrlClick()
{
  var atog = document.getElementById('anno-toggle');
  atog.classList.toggle( "active" );
  if(isActive(atog)) {
    sidebar_anno_slideOut();
    $('#anno-toggle').removeClass('glyphicon-eye-open');
    $('#anno-toggle').addClass('glyphicon-eye-close');
    } else {
      sidebar_anno_slideIn();
      $('#anno-toggle').addClass('glyphicon-eye-open');
      $('#anno-toggle').removeClass('glyphicon-eye-close');
  }
}


// reuse the calls to be like annotorious_ui's
var isFocus=false;
function focusClick() {
   isFocus = !isFocus;
   var ftog = document.getElementById('focus-toggle');
   if(isFocus) {
      ftog.style.color='red';
      } else {
        ftog.style.color='black';
   }
}

function annoClick(h)
{
  if(isFocus) {
    centerAnnoByHash(h,true);
    } else {
      highlightAnnoByHash(h);
  }
}

/*
  http://stackoverflow.com/questions/7616461/
        generate-a-hash-from-string-in-javascript-jquery
*/
String.prototype.hashCode = function() {
  var hash = 0;
  var len=this.length;
  for (var i = 0; i < len; i++) {
    hash  = ((hash << 5) - hash) + this.charCodeAt(i);
    hash = hash >>> 0; // Convert to 32bit integer
  }
  return hash;
}

function getHash(item) {
   if(item == null)
     return 0;
   var txt= item.context 
            +item.shapes[0].geometry.x
            +item.shapes[0].geometry.y
            +item.shapes[0].geometry.width
            +item.shapes[0].geometry.height;
   return txt.hashCode();
}

function getHashWithLocation(location) {
   if(location == null)
     return 0;
   var txt= "ISRD" + location.x
              +location.y
            +location.width
              +location.height;
   return txt.hashCode();
}
function printAnno(item) {
  var x=item.shapes[0].geometry.x;
  var y=item.shapes[0].geometry.y;
  var w=item.shapes[0].geometry.width;
  var h=item.shapes[0].geometry.height;
window.console.log("printAnno, x,y,w,h "+x+" "+y+" "+w+" "+h);
}

// check to see if the item is in view,
//  viewer,
//       bx,by     bx+bw,by
//       bx,by+bh  bx+bw,by+bh
//  anno,
//      left,top    left+Aw,top
//      left,top+Ah left+Aw,top+Ah
//  outside,
//    top+Ah < by  || top>by+bh
//    left > bx+bw || left+Aw <bx

function annoInBounds(item,bounding_x,bounding_y,bounding_width,bounding_height) {
  var id=makeAnnoID(item);
  var annotationObj = document.getElementById(id);
  if(annotationObj) {
    var anno_width= parseInt(annotationObj.style.width);
    var anno_height= parseInt(annotationObj.style.height);
    var anno_top= parseInt(annotationObj.style.top);
    var anno_left= parseInt(annotationObj.style.left);

    if( anno_top+anno_height < bounding_y || anno_top > bounding_y+bounding_height ||
        anno_left >  bounding_x+bounding_width || anno_left+anno_width < bounding_x)
       return -1;
    return id;
    } else {
      alertify.error("Error: non-exisiting annoId, ",id);
  }
  return -1;
}

function annoInViewer(item) {
// pick the first one..
  var viewer = document.getElementsByTagName('canvas');
  var viewer_width=parseInt(viewer[0].width);
  var viewer_height=parseInt(viewer[0].height);
  return annoInBounds(item, 0, 0, viewer_width, viewer_height);
}

function annoInAnno(item,bounding_anno) {
  var b_id=makeAnnoID(bounding_anno);
  var i_id=makeAnnoID(item);
  if(i_id == b_id)
    return i_id;
  var b_anno = document.getElementById(b_id);
  if(b_anno) {
    var b_width= parseInt(b_anno.style.width);
    var b_height= parseInt(b_anno.style.height);
    var b_top= parseInt(b_anno.style.top);
    var b_left= parseInt(b_anno.style.left);
    return annoInBounds(item, b_left, b_top, b_width, b_height);
    } else {
      alertify.error("Error: non-exisiting annoId, ",b_id);
  }
  return -1;
}

// dump a listed of annotation wrapped in logInfo
function annoDump() {
  var p=myAnno.getAnnotations();
  var len=p.length;
  var alist=[];
  for(var i=0; i < len; i++) {
      alist.push(annoJSON(p[i]));
  }
  var tmp = { "annoList" : alist };
  return tmp;
}

function annoExist(item) {
  var p=myAnno.getAnnotations();
  for (var i = 0; i < p.length; i++) {
    if (getHash(p[i]) === getHash(item)) {
       return 1;
    }
  }
  return 0;
}

// retrieve i-th annotation from the inner list
function annoRetrieve(i) {
  var p=myAnno.getAnnotations();
  var len = p.length;
  if (i>=0 && i <len)
    return p[i];
  return null;
}

function annoRetrieveByHash(h) {
  var p=myAnno.getAnnotations();
  var len = p.length;
  for (var i = 0; i < len; i++) {
    if(h == getHash(p[i])) {
      return p[i];
    }
  }
  return null;
}
// collect a list of annotations falling withing a big
// annotation's boundary
function annoSetInAnno(bounding_anno) {
window.console.log("bounding anno is ", makeAnnoID(bounding_anno));
  var annotationsToLoad =[]; 
  var p=myAnno.getAnnotations();
  var len=p.length;
  for (var i = 0; i < len; i++) {
    var id=annoInAnno(p[i],bounding_anno);
    if(id != -1) {
       annotationsToLoad.push(p[i]);
       window.console.log("this anno IS in view ",id);
       } else {
         window.console.log("this anno IS NOT in view", makeAnnoID(p[i]));
    }
  }
  return annotationsToLoad;
}

// collect a list of annotation falling within the viewer's
// boundary
function annoSetInViewer()
{
  var annotationsToLoad = [];
  var p=myAnno.getAnnotations();
  var len=p.length;
  for (var i = 0; i < len; i++) {
    var id=annoInViewer(p[i]);
    if(id != -1) {
       annotationsToLoad.push(p[i]);
       window.console.log("this anno IS in view ",id);
       } else {
         window.console.log("this anno IS NOT in view");
    }
  }
  return annotationsToLoad;
}

function annoChk()
{
  var p=myAnno.getAnnotations();
  var len=p.length;
  for (var i = 0; i < len; i++) {
    printAnno(p[i]);
    var id=annoInViewer(p[i]);
    if(id != -1) {
       window.console.log("this anno IS in view ",id);
       } else {
         window.console.log("this anno IS NOT in view");
    }
  }
}

var save1=null;
var save2=null;

// just compare the distance between first 2 annotations
function annoCompare()
{
window.console.log("----> annoCompare..");
  if(save1!=null && save2!=null ) {
    var p=myAnno.getAnnotations();
    var len=p.length;
    var tmp=null;
    var a1=null;
    var a2=null;
    for(var i=0;i < len; i++) {
      tmp=makeAnnoID(p[i]);
      if(tmp == save1) {
       a1=p[i];
       window.console.log("i for a1 is ",i);
      } else {
        if(tmp == save2) {
          a2=p[i];
          window.console.log("i for a2 is ",i);
        }
      }
    }
    var x1=a1.shapes[0].geometry.x;
    var y1=a1.shapes[0].geometry.y;
    var a2=p[len-2];
    var x2=a2.shapes[0].geometry.x;
    var y2=a2.shapes[0].geometry.y;
    var pixel1= myViewer.viewport.pixelFromPoint(new OpenSeadragon.Point(x1,y1)); 
    var pixel2= myViewer.viewport.pixelFromPoint(new OpenSeadragon.Point(x2,y2)); 
window.console.log("orig x1, ",x1," y1,",y1); 
window.console.log("orig x2, ",x2," y2,",y2); 
window.console.log("x1, ",pixel1.x," to x2,",pixel2.x); 
window.console.log("y1, ",pixel1.y," to y2,",pixel2.y); 
    var distance=pixel1.distanceTo(pixel2);
window.console.log("distance is ..",distance);
  }
}

// used by backend-loading from file or chaise
function annoAdd(item) {
//window.console.log("calling annoAdd..");
  if( annoExist(item) )
    return;

  var style=setupStyleForAnnotation(item);
  if(isMarkerAnnotation) { // for standalone load from file
    updateDisplayType2Style(item, S_DTYPE_MARKER);
    updateMarker2Style(item,null,saveMarkerColor,null);
  }
  if(isSpecialAnnotation) { // for standalone load from file
    updateSpecial2Style(item,S_SPECIAL_BORDER_DEFAULT);
  }
  if(isHiddenAnnotation) { // for standalone load from file
    updateDisplayType2Style(item, S_DTYPE_HIDDEN);
  }

  myAnno.addAnnotation(item);

  saveAnnoDiv.id=makeAnnoID(item);
    // assign the marker's id
  var markerObj=saveAnnoDiv.childNodes[1]; // marker_node
  markerObj.id=makeMarkerID(saveAnnoDiv.id);

  markerObj.onmouseover=function() {
    onMouseOverAnnotationFoo(item);
    markerObj.style.display = 'none';
  };
  markerObj.onmouseout=function() {
    onMouseOutOfAnnotationFoo(item);
    markerObj.style.display = 'block';
  };
 
  updateAnnotationDOMWithStyle(item);

  if(TEST_MODE && isMarkerAnnotation)
    unmarkMarker();
  if(TEST_MODE && isSpecialAnnotation)
    unmarkSpecial();
  if(TEST_MODE && isHiddenAnnotation)
    unmarkHidden();
}

// unhighlight is to discard the item from the current
function annoUnHighlightAnnotation(item) {
  if(saveCurrentHighlightAnnotation) {
    if(getHash(saveCurrentHighlightAnnotation)==getHash(item)) {
      updateAnnotationDisplay(item);
    }
    myAnno.highlightAnnotation();
    saveCurrentHighlightAnnotation=null;
  }
}

function annoHighlightAnnotation(item) {
  if(saveCurrentHighlightAnnotation) {
    if(getHash(saveCurrentHighlightAnnotation) != getHash(item)) {
       // process the mouse on that one
//window.console.log("in highlight recovery..");
      updateAnnotationDisplay(saveCurrentHighlightAnnotation);
      enableHightlightState(item);
    }
  } else {
    enableHighlightState(item);
  }
  myAnno.highlightAnnotation(item);
  saveCurrentHighlightAnnotation=item;
}

// the Focus-'eye' calls this,
// from viewer to chaise
function annoClickAnnotation() {
  if(saveCurrentHighlightAnnotation) {
    var item=saveCurrentHighlightAnnotation;
    var json=annoJSON(item);
    updateAnnotationList('onClickAnnotation', json);
  }
  if(!enableEmbedded) { // tag on testing displayType updates
window.console.log("in annoClickAnnotation...");
//    updateDisplayTypeTest();
  }
}

// if hidden, becomes border
// else always hide it
function annoZapAnnotation() {
  if(saveCurrentHighlightAnnotation) {
    var item=saveCurrentHighlightAnnotation;
    var _style=item.shapes[0].style;
    switch (_style['displayType']) {
      case S_DTYPE_HIDDEN:
        updateDisplayType2Style(item, S_DTYPE_BORDER);
        break;
      default:
        updateDisplayType2Style(item, S_DTYPE_HIDDEN);
    }
    updateAnnotationDOMWithStyle(item);
  }
}

// turn it into a marker
// back into a border..
function annoMarkAnnotation() {
  if(saveCurrentHighlightAnnotation) {
    var item=saveCurrentHighlightAnnotation;
    var _style=item.shapes[0].style;
    switch (_style['displayType']) {
      case S_DTYPE_MARKER:
        updateDisplayType2Style(item, S_DTYPE_BORDER);
        break;
      default:
        updateDisplayType2Style(item, S_DTYPE_MARKER);
    }
    updateAnnotationDOMWithStyle(item);
  }
}

function smallMarker(_item) {
  var item=_item;
  var x=item.shapes[0].geometry.x;
  var y=item.shapes[0].geometry.y;
  var w=item.shapes[0].geometry.width;
  var h=item.shapes[0].geometry.height;

  var point1=new OpenSeadragon.Point(x,y);
  var point2=new OpenSeadragon.Point(x+w,y+h);

  var pixel1= myViewer.viewport.pixelFromPoint(point1);
  var pixel2= myViewer.viewport.pixelFromPoint(point2);
  var distance= pixel1.distanceTo(pixel2);
  // default is 24 pixel marker
  if(distance < 30) {
     return 1;
  }
  return 0;
}

// initializing of annotorious
// also for standalone viewer's annotation manipulation
function annoSetup(_anno,_viewer) {

  _anno.makeAnnotatable(_viewer);

  // Sets the annotation shape's outline to red  
/*
  var top_anno=_anno;
  anno.setProperties({
      outline: 'red'
  });
*/

  _anno.addHandler("onAnnotationCreated", function(target) {
    var item=target;
window.console.log("--->calling onAnnotationCreated...");
    // assign the real annotation's id
    saveAnnoDiv.id=makeAnnoID(item);
    // assign the marker's id
    var markerObj=saveAnnoDiv.childNodes[1]; // marker_node
    markerObj.id=makeMarkerID(saveAnnoDiv.id);
    markerObj.onmouseover=function() {
      onMouseOverAnnotationFoo(target);
      markerObj.style.display = 'none';
    };
    markerObj.onmouseout=function() {
      onMouseOutOfAnnotationFoo(target);
      markerObj.style.display = 'block';
    };

    var style=setupStyleForAnnotation(item);

if(MEI_TEST) {
updateStyle2Default(item);
updateAnnotationDOMWithStyle(item);

var ctxt=item.context;
var myAnnotation = {
    src : "dzi://openseadragon/something",
    text : 'My new annotation',
    context: ctxt,
    shapes : [{
        type : 'rect',
        geometry : { x : 0.1, y: 0.1, width : 0.4, height: 0.3 },
        style: {
/*
      fill: '#E5CCFF',
      hi_fill: '#E5CCFF',
      stroke: '#E5CCFF',
      hi_stroke: '#E5CCFF',
      outline: '#E5CCFF',
      hi_outline: '#E5CCFF',

      Ce: 2, //outline_width
      xe: 2, //hi_outline_width
      Ee: 1, //stroke_width
      ye: 1 //hi_stroke_width
*/
          fill:'#E5CCFF',
          stroke:'#000',
          outline:'#000',
          outline_width:2,
          stroke_width:1,
          hi_fill:'#fff',
          hi_stroke:'#fff',
          hi_outline:'#E5CCFF',
          hi_outline_width:2,
          hi_stroke_width:1
        }
    }]
};
myAnno.addAnnotation(myAnnotation);
return;
}

    if(isMarkerAnnotation) { //only for standalone mode
      updateDisplayType2Style(item, S_DTYPE_MARKER);
      updateMarker2Style(item,null,saveMarkerColor,null);
    }
    if(isSpecialAnnotation) { //only for standalone mode
      updateSpecial2Style(item,S_SPECIAL_BORDER_DEFAULT);
    }
    if(isHiddenAnnotation) { //only for standalone mode
      updateDisplayType2Style(item, S_DTYPE_HIDDEN);
    }

    // put it into the Dom..
    updateAnnotationDOMWithStyle(item);
    
    var json=annoJSON(item);
    updateAnnotationList('onAnnotationCreated', json);

// testing pixel distance on viewport
    if(save1 == null) {
      save1= saveAnnoDiv.id;
      } else {
      if(save2 == null)
        save2 = saveAnnoDiv.id;
    }

  }); // onAnnotationCreate..
  _anno.addHandler("onAnnotationRemoved", function(target) {
    var item=target;
    var json=annoJSON(item);
    updateAnnotationList('onAnnotationRemoved', json);
  });
  _anno.addHandler("onAnnotationUpdated", function(target) {
    var item=target;
    var json=annoJSON(item);
    // if the annotation has a temporary id, replace it with real one */
    updateAnnotationID(item);
    updateAnnotationDOMWithStyle(item);
    updateAnnotationList('onAnnotationUpdated', json);
  });
// the annotation would have gotten highlighted
  _anno.addHandler("onMouseOverAnnotation", function(target) {
    onMouseOverAnnotationFoo(target);
  });
  _anno.addHandler("onMouseOutOfAnnotation", function(target) {
    onMouseOutOfAnnotationFoo(target);
  });
  _anno.addHandler("onSelectionCompleted", function(target) {
    var item=target;
    // this is not a complete annotation item..
    var json = JSON.parse(JSON.stringify(item));
    updateAnnotationList('annotationDrawn', json);
  });
  myAnno=_anno;
  myAnnoReady = true;
  setupAnnoUI();
}

function annoReady() {
  updateAnnotationState('annotoriousReady', myAnnoReady);
}

// act as if this is mouse over underlying annotation
function onMouseOverAnnotationFoo(target) {
    var item=target;
    var json=annoJSON(item);
    if(saveCurrentHighlightAnnotation == item) {
      // do nothing
      return;
    }
    saveCurrentHighlightAnnotation=item;
    enableBorderState(item);
    updateAnnotationList('onHighlighted', json);
}

// act as if this is mosue out of underlying annotation
function onMouseOutOfAnnotationFoo(target) {
    var item=target;
    var json=annoJSON(item);
    if(saveCurrentHighlightAnnotation==null) {
      // do nothing
      return;
    }
    updateAnnotationDisplay(item);
    if(saveCurrentHighlightAnnotation == item) {
      saveCurrentHighlightAnnotation=null;
    }
    updateAnnotationList('onUnHighlighted', json);
}

// turn back to unhighlighted annotation state
// highlighting is done by the annotorious
function enableHighlightState(item) {
  var anno_id=makeAnnoID(item);
  var marker_id=makeMarkerID(anno_id);
  var markerObj=document.getElementById(marker_id);
  // disable marker's css effect
  var outer_node=document.getElementById(anno_id);
  var inner_node = outer_node.childNodes[0];
  if(outer_node.classList.contains("annotation-overlay-outer"))
    outer_node.classList.remove("annotation-overlay-outer");
  if(inner_node.classList.contains("annotation-overlay-inner"))
    inner_node.classList.remove("annotation-overlay-inner");
  //
  // if it is a special annotation, reset the borderWidth
  if( isSpecialAnnotationType(item)) {
    outer_node.style.borderWidth="3px";
  }

  markerObj.style.display = 'none';
}
// turn back to unhighlighted annotation state
// highlighting is done by the annotorious
function enableBorderState(item) {
  var anno_id=makeAnnoID(item);
  var marker_id=makeMarkerID(anno_id);
  var markerObj=document.getElementById(marker_id);
  // enable marker's css effect
  var outer_node=document.getElementById(anno_id);
  // when in 'update' or 'delete' mode, it looks like openseadragon
  // already removed the DOM object
  if(outer_node) {
    var inner_node = outer_node.childNodes[0];
    if(outer_node.classList.contains("annotation-overlay-outer"))
      outer_node.classList.remove("annotation-overlay-outer");
    if(inner_node.classList.contains("annotation-overlay-inner"))
      inner_node.classList.remove("annotation-overlay-inner");

  // if it is a special annotation, reset the borderWidth
    if( isSpecialAnnotationType(item)) {
      outer_node.style.borderWidth="3px";
    }
  } else {
//window.console.log("NULL, enableVisbleState.. could be in update mode..",anno_id);
  }

  if(markerObj)
    markerObj.style.display = 'none';
}

function enableHiddenState(item) {
  var anno_id=makeAnnoID(item);
  var marker_id=makeMarkerID(anno_id);

  // enable marker's css effect
  var outer_node=document.getElementById(anno_id);
  if(outer_node) {
    var inner_node = outer_node.childNodes[0];
  // not duplicate
    if(! outer_node.classList.contains("annotation-overlay-outer"))
      outer_node.classList.add("annotation-overlay-outer");
    if(! inner_node.classList.contains("annotation-overlay-inner"))
      inner_node.classList.add("annotation-overlay-inner");
  
// in case it is special then need to reset the border to outer_node
    if( isSpecialAnnotationType(item)) {
      outer_node.style.borderWidth="";
    }
  
    var markerObj=document.getElementById(marker_id);
    markerObj.style.display = 'none';
  } else {
//window.console.log("NULL, enableHiddenState.. can be in update ",anno_id);
  }
}

// if a marker is being covered by another marker almost completely 
// and is very small(relatively to the viewer), then
// make one of them the 'FAT marker' and turn the current one into
// hidden one.
function enableMarkerState(item) {
  var anno_id=makeAnnoID(item);
  var marker_id=makeMarkerID(anno_id);

  // enable marker's css effect
  var outer_node=document.getElementById(anno_id);
  if(outer_node) {
    var inner_node = outer_node.childNodes[0];
  // not duplicate
    if(! outer_node.classList.contains("annotation-overlay-outer"))
      outer_node.classList.add("annotation-overlay-outer");
    if(! inner_node.classList.contains("annotation-overlay-inner"))
      inner_node.classList.add("annotation-overlay-inner");
  
    if( isSpecialAnnotationType(item)) {
      outer_node.style.borderWidth="";
    }
  
    var markerObj=document.getElementById(marker_id);
    markerObj.style.display = 'block';
  } else {
//window.console.log("NULL, enableMarkerState.. could be in update ",anno_id);
  }
}

/*
   shape:item.shapes[0].type,
   x: item.shapes[0].geometry.x,
   y: item.shapes[0].geometry.y,
   width: item.shapes[0].geometry.width,
   height: item.shapes[0].geometry.height
*/
function annoJSON(item) {
   var json = JSON.stringify(item,null,2);
   return json;
}


function annotate() {
  var button = document.getElementById('osd-annotate-button');
  button.style.color = '#777';

  myAnno.activateSelector(function() {
    // Reset button style
    button.style.color = '#fff';
  });
}

// only shape supported is rect, this is to create an annotation
// item by hand
function annoMakeAnno(_src,_context,_text,_x,_y,_width,_height)
{
  var myAnnotation = {
    src : _src,
    context : _context,
    text : _text,
    shapes : [{
      type : 'rect',
      geometry : { x : _x, y: _y, width : _width, height: _height }
    }]
  }
  return myAnnotation;
}

function updateAnnotationID(item) {
  var annoID=makeAnnoID(item);
  var markerID=makeMarkerID(annoID);
  // if it exists on document then do nothing
  var v=document.getElementById(annoID);
  if(v)  
    return;

  var location=item.shapes[0].geometry;
  var tannoID=makeAnnoIDWithLocation(location);
  v=document.getElementById(tannoID);
  if(v) {
    // reassign the annotation's id
    v.id=annoID;
    // reassign the marker's id
    var markerObj=v.childNodes[1]; // marker_node
    markerObj.id=markerID;
    } else {
window.console.log("BAD.. need to panic..");
  }
}

/*************************** ui part **************************/

/* functions related to annotorious ui and backend linkup  */

function updateAnnotations() {
  var annotations = myAnno.getAnnotations();
  var list = document.getElementById('annotations-list');
  if(list == null)
    return;
  _clearAnnoOptions();
  list.innerHTML = '';
  var outItem = '<div class="panel panel-default">' +
                       '<div class="list-group">';

  for (var i = 0; i < annotations.length; i++) {
    _addAnnoOption(getHash(annotations[i]));
    var oneItem = '<a class="list-group-item" id='+
           makeAnnoListID(annotations[i]) + ' style="color:black" '+
           'onclick=annoClick('+getHash(annotations[i]) +') '+
           '>' + annotations[i].text +
           '</a>';
    outItem += oneItem;
  }
  list.innerHTML += outItem;
//window.console.log(list.innerHTML);
}

function colorAnnoListItem(item,c) {
  var id=makeAnnoListID(item)
  var v=document.getElementById(id);
  if(v) {
    if(c) {
      v.style.color = 'red';
      } else {
        v.style.color = 'black';
    }
  }
}


function _clearAnnoOptions() {
  var alist = document.getElementById('anno-list');
  if(alist == null)
    return;
  while (alist.length > 0) {
      alist.remove(alist.length - 1);
  }
}

function _addAnnoOption(name) {
  var alist = document.getElementById('anno-list');
  if(alist == null)
    return;
  var newopt = document.createElement('option');
  newopt.text=name;
  newopt.value=name;
  alist.add(newopt);
}

function annoBtnEnter() {
   annoBtnFadeIn();
}

function annoBtnExit() {
}

function annoBtnFadeOut() {
//window.console.log("-->calling fadeOut..");

  var $button = $("#osd-annotate-button");

//  if ($button.is(':hover')) {
//window.console.log("..don't fade..");
//  } else {
//XXX    $button.fadeOut(2000);
//window.console.log("..fading for sure..");
//  }

}

function annoBtnFadeIn(){
  var $button = $("#osd-annotate-button");
//XXX  $button.fadeIn("fast");
}

function saveAnno(fname)
{
  TEST_MODE=true;
  var tmp = annoDump();
  var textToWrite = JSON.stringify(tmp);
  var textFileAsBlob = new Blob([textToWrite], {type:'text/json'});
  var fileNameToSaveAs = fname;
  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL != null)
  {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
  }
  else
  {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
      downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
  }
  downloadLink.click();
}

// load annotation from a json file
function loadAnno(fname)
{
  var f=fname;
  // var href= window.location.href;
  var origin=window.location.origin; // http://localhost
  var input=origin+fname;

  TEST_MODE=true;
  var tmp=ckExist(input);
  readAll(JSON.parse(tmp));
}

// center i-th annotation in the middle
// and zoom in and highlight it
function centerAnnoByHash(i,zoomIt)
{
  var h=i;
  if(h == null) {
     return;
  }
  var item = annoRetrieveByHash(h);
  if(item) {
   // get x,y location
     var w=item.shapes[0].geometry.width;
     var h= item.shapes[0].geometry.height;
     var x=item.shapes[0].geometry.x;
     var y=item.shapes[0].geometry.y;
     var mx=(w/5);
     var my=(h/5);
     var ctxt=item.context;
     var src=item.src;

     if(zoomIt) {
       goPositionByBounds(x-mx,y-my,w+(2*mx),h+(2*my));
       } else {
         goPosition(x+(w/2),y+(h/2),null);
     }
     annoHighlightAnnotation(item);
     // collect up a list of annotations within and send it back
     // to chaise
/***
     var alist=annoSetInAnno(item);
     var json = JSON.stringify(alist);
     updateAnnotationList('onInViewAnnotations', json);
***/
  }
}

function highlightAnnoByHash(i)
{
  var h=i;
  if(h == null) {
     annoHighlightAnnotation();
     return;
  }
  var item = annoRetrieveByHash(h);
  if(item) {
     resizeViewport(item);
     annoHighlightAnnotation(item);
  }
}

// resize viewport if needed to include the
// anno item
function resizeViewport(item) {
 var viewerRect=myViewer.viewport.getBounds(true);
//window.console.log("resizeViewport.. original view rect"+viewerRect.toString());
 var _x=item.shapes[0].geometry.x;
 var _y=item.shapes[0].geometry.y;
 var _w=item.shapes[0].geometry.width;
 var _h=item.shapes[0].geometry.height;
 var annoRect=new OpenSeadragon.Rect(_x, _y, _w, _h);
//window.console.log("resizeViewport.. anno rect"+annoRect.toString());
 var newRect=viewerRect.union(annoRect);
//window.console.log("resizeViewport.. union rect"+newRect.toString());
 var ostr=viewerRect.toString();
 var nstr=newRect.toString();
// var eq=viewerRect.equals(newRect); -- precision problem
 var eq = (ostr === nstr);
 if(eq) {
   // no need to resize
//window.console.log("no need to resize the viewport..");
   } else {
//window.console.log("need to resize the viewport..");
    var _nx=newRect.x;
    var _ny=newRect.y;
    var _nw=newRect.width+(_w/2);
    var _nh=newRect.height+(_h/2);
    var nnRect  = new OpenSeadragon.Rect(_nx, _ny, _nw, _nh);
    myViewer.viewport.fitBounds(nnRect,true);
//window.console.log("done to resize the viewport..");
 }
}

function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}


function readAll(blob) {
   if(blob) {
      // step through it and load it in
      var alist=blob['annoList'];
      var len=alist.length;
      var tt;
      var t;
      for(var i=0; i< len; i++) {
         var p=alist[i];
         if(typeof p !== "object") {
           t=JSON.parse(p);
           } else {
             t=p;
         }
         annoAdd(t);
      }
   }
   updateAnnotations();
}


// since annotorious did not implement this for openseadragon
// we mimick it here.
// this does not change any annotations' style but the overlays
// in DOM
// outer = goog.dom.createDom('div', 'annotorious-ol-boxmarker-outer');
function annoHideAllAnnotations()
{
  $("div.annotorious-ol-boxmarker-outer").hide();
}

function annoShowAllAnnotations()
{
  $("div.annotorious-ol-boxmarker-outer").show();
}

//XXX -->  
// Test switching the annotation's displayType to something else
function updateDisplayTypeTest() {
window.console.log("calling updateDisplayTypeTest..");
  if(saveCurrentHighlightAnnotation) {
    var item=saveCurrentHighlightAnnotation;
    var _style=item.shapes[0].style;
    switch (_style['displayType']) {
      case S_DTYPE_MARKER:
        updateDisplayType2Style(item, S_DTYPE_BORDER);
        break;
      case S_DTYPE_BORDER:
        updateDisplayType2Style(item, S_DTYPE_HIDDEN);
        break;
      case S_DTYPE_HIDDEN:
        updateDisplayType2Style(item, S_DTYPE_MARKER);
        break;
    }
    updateAnnotationDOMWithStyle(item);
  }
}


// making a test annotation
function makeDummy() {
  annoMakeAnno(
    "dzi://openseadragon/something",
    "http://localhost/tiletiff/index.html?url=http://localhost/tiletiff/data/wide.dzi",
    "123",
    0.6491228070175439,
    -0.017857142857142877,
    0.032581453634085156,
    0.3020050125313283
  );
}

// Simulate a click on Annotorious editor's Cancel button to stop selection
function cancelEditor() {
    if (enableEmbedded) {
        document.getElementsByClassName('annotorious-editor-button-cancel')[0].click();
    }
}
