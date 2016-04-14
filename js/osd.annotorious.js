/* functions related to annotorious */
var myAnnoReady = false;
var myAnno=null;
var saveCurrentHighlightAnnotation=null;

var CREATE_EVENT_TYPE='CREATE';
var UPDATE_EVENT_TYPE='UPDATE';
var REMOVE_EVENT_TYPE='REMOVE';
var CLICK_EVENT_TYPE='CLICK';
var INFO_EVENT_TYPE='INFO';

var TEST_MODE=false;

function makeAnnoID(item) {
  var id='anno_'+getHash(item);
  return id;
}

function makeAnnoListID(item) {
//  var id='alist_'+getHash(item);
  var id=getHash(item);
  return id;
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
   var txt= item.context
              +item.shapes[0].geometry.x
                +item.shapes[0].geometry.y
              +item.shapes[0].geometry.width
                +item.shapes[0].geometry.height;
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
  var anno = document.getElementById(id);
  if(anno) {
    var anno_width= parseInt(anno.style.width);
    var anno_height= parseInt(anno.style.height);
    var anno_top= parseInt(anno.style.top);
    var anno_left= parseInt(anno.style.left);

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
      var item=p[i];
      if(isArrowAnnotation) {
        var style=p[i].shapes[0].style;
        if(style['color']==null)
           p[i].shapes[0].style = { "color":"green" };
      }
      alist.push(annoLog(p[i],INFO_EVENT_TYPE));
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
// collect a list of annotaitons falling withing a big
// annotation's boundary
function annoSetInAnno(bounding_anno) {
window.console.log("bounding anno is ", makeAnnoID(bounding_anno));
  var annotationsToLoad = {"annoList":[]};
  var p=myAnno.getAnnotations();
  var len=p.length;
  for (var i = 0; i < len; i++) {
    var id=annoInAnno(p[i],bounding_anno);
    if(id != -1) {
       var annotationObj = {
            "type": "openseadragon_dzi",
            "id": null,
            "event": "INFO",
            "data": p[i]};
       annotationsToLoad.annoList.push(annotationObj);
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
  var annotationsToLoad = {"annoList":[]};
  var p=myAnno.getAnnotations();
  var len=p.length;
  for (var i = 0; i < len; i++) {
    var id=annoInViewer(p[i]);
    if(id != -1) {
       var annotationObj = {
            "type": "openseadragon_dzi",
            "id": null,
            "event": "INFO",
            "data": p[i]};
       annotationsToLoad.annoList.push(annotationObj);
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

function annoAdd(item) {
  if( annoExist(item) ) {
    return;
  }
  // special handling when item's style is not empty
  //
  var style=item.shapes[0].style;
  if(style.length != 0) { // { color:'red', 'border':'green' }
    var b=style['color'];
    if(TEST_MODE && b != null) { markArrow(); }
    if(isArrowAnnotation) {
      if(b) 
        saveArrowColor=b;
        else saveArrowColor='red';
    }
  }
  myAnno.addAnnotation(item);
  if(TEST_MODE && isArrowAnnotation) { unmarkArrow(); }
}

// item is discarded
function annoUnHighlightAnnotation(item) {
  myAnno.highlightAnnotation();
  if(saveCurrentHighlightAnnotation==item) {
    window.console.log("current unhighlight is ..",getHash(item));
    saveCurrentHighlightAnnotation=null;
  }
}
function annoHighlightAnnotation(item) {
  myAnno.highlightAnnotation(item);
  saveCurrentHighlightAnnotation=item;
  window.console.log("current highlight is ..",getHash(item));
}

function annoClickAnnotation() {
  saveCurrentHighlightAnnotation=null;
  if(saveCurrentHighlightAnnotation) {
    var item=saveCurrentHighlightAnnotaiton;
    var json=annoLog(item,INFO_EVENT_TYPE);
    updateAnnotationList('onClickAnnotation', json);
  }
window.console.log("here in annoClickAnnotation");
}

function annoSetup(_anno,_viewer) {
  _anno.makeAnnotatable(_viewer);
  _anno.addHandler("onAnnotationCreated", function(target) {
    var item=target;
//window.console.log("--->calling onAnnotationCreated...");
    saveAnnoDiv.id=makeAnnoID(item);
    if(isArrowAnnotation) {
        item.shapes[0].style = { "color":saveArrowColor };
    }
    var json=annoLog(item,CREATE_EVENT_TYPE);
    updateAnnotationList('onAnnotationCreated', json);
  });
  _anno.addHandler("onAnnotationRemoved", function(target) {
    var item=target;
    var json=annoLog(item,REMOVE_EVENT_TYPE);
    updateAnnotationList('onAnnotationRemoved', json);
  });
  _anno.addHandler("onAnnotationUpdated", function(target) {
    var item=target;
    var json=annoLog(item,UPDATE_EVENT_TYPE);
    updateAnnotationList('onAnnotationUpdated', json);
  });
// the annotation would have gotten highlighted
  _anno.addHandler("onMouseOverAnnotation", function(target) {
    var item=target;
    var json=annoLog(item,INFO_EVENT_TYPE);
    saveCurrentHighlightAnnotation=item;
    window.console.log("by mouse, current highlight is ..",getHash(item));
    updateAnnotationList('onHighlighted', json);
  });
  _anno.addHandler("onMouseOutOfAnnotation", function(target) {
    var item=target;
    var json=annoLog(item,INFO_EVENT_TYPE);
    window.console.log("by mouse, current unhighlight is ..",getHash(item));
    if(saveCurrentHighlightAnnotation == item) {
      saveCurrentHighlightAnnotation=null;
    }
    updateAnnotationList('onUnHighlighted', json);
  });
  _anno.addHandler("onSelectionCompleted", function(target) {
    var item=target;
    // this is not a complete annotation item..
    var json = JSON.parse(JSON.stringify(item));
    updateAnnotationList('annotationDrawn', json);
  });
  myAnno=_anno;
  myAnnoReady = true;
  updateAnnotationState('annotoriousReady', myAnnoReady);
  setupAnnoUI();
}

/*
   src:item.src,
   context:item.context,
   text:item.text,
   shape:item.shapes[0].type,
   x: item.shapes[0].geometry.x,
   y: item.shapes[0].geometry.y,
   width: item.shapes[0].geometry.width,
   height: item.shapes[0].geometry.height
*/
function annoLog(item, eventType) {
   var hash=getHash(item);
   var tmp= { type: 'openseadragon_dzi',
              id : hash,
              event : eventType,
              data : item
            };

   var json = JSON.stringify(tmp,null,2);

/* if data has url embedded in there. need to escape with
encoded = encodeURIComponent( parm )
*/
   // if( debug ) {
   //    printDebug(json);
   // }
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
    var oneItem = '<a href="#" class="list-group-item" id='+
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
  TEST_MODE=true;
  var tmp=ckExist(fname);
//  window.console.log("got "+tmp);
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
     var mx=(w/10);
     var my=(h/10);
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
     var alist=annoSetInAnno(item);
     var json = JSON.stringify(alist);
     updateAnnotationList('onInViewAnnotations', json);
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
         tt= t["data"];
         annoAdd(tt);
      }
   }
   updateAnnotations();
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
