/* functions related to annotorious */
var myAnnoReady = false;
var myAnno=null;

var CREATE_EVENT_TYPE='CREATE';
var UPDATE_EVENT_TYPE='UPDATE';
var REMOVE_EVENT_TYPE='REMOVE';
var INFO_EVENT_TYPE='INFO';

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

// dump a listed of annotation wrapped in logInfo
function annoDump() {
  var p=myAnno.getAnnotations();
  var len=p.length;
  var alist=[];
  for(var i=0; i < len; i++) {
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

function annoChk()
{
  var p=myAnno.getAnnotations();
  var len=p.length;
  for (var i = 0; i < len; i++) {
    printAnno(p[i]);
  }
}

function annoAdd(item) {
  if( annoExist(item) ) {
    return;
  }
  myAnno.addAnnotation(item);
}

// item is discarded
function annoUnHighlightAnnotation(item) {
  myAnno.highlightAnnotation();
}
function annoHighlightAnnotation(item) {
  myAnno.highlightAnnotation(item);
}

function annoSetup(_anno,_viewer) {
  _anno.makeAnnotatable(_viewer);
  _anno.addHandler("onAnnotationCreated", function(target) {
    var item=target;
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
    updateAnnotationList('onHighlighted', json);
  });
  _anno.addHandler("onMouseOutOfAnnotation", function(target) {
    var item=target;
    var json=annoLog(item,INFO_EVENT_TYPE);
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
           getHash(annotations[i]) + ' style="color:black" '+
//           'ondblclick=centerAnnoByHash('+getHash(annotations[i]) +',true) '+
           'onclick=highlightAnnoByHash('+getHash(annotations[i]) +') '+
           '>' + annotations[i].text +
           '</a>';
    outItem += oneItem;
  }
  list.innerHTML += outItem;
//window.console.log(list.innerHTML);
}

function colorAnnoListItem(num,c) {
  var id=num.toString();
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
  var tmp=ckExist(fname);
//  window.console.log("got "+tmp);
  readAll(JSON.parse(tmp));
}

// center i-th annotation in the middle
// and zoom in and highlight it
function centerAnnoByHash(i,zoomIt)
{
window.console.log("centerAnnoByHash..");
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
  }
}

function highlightAnnoByHash(i)
{
window.console.log("in highlightAnnoByHash..");
  var h=i;
  if(h == null) {
     annoHighlightAnnotation();
     return;
  }
  var item = annoRetrieveByHash(h);
window.console.log("in highlightAnnoByHash 2.. =>"+item.text);
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
// var eq=viewerRect.equals(newRect);
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
