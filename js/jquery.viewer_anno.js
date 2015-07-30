
/* functions related to annotorious */

var myAnno=null;

var CREATE_EVENT_TYPE='CREATE';
var UPDATE_EVENT_TYPE='UPDATE';
var REMOVE_EVENT_TYPE='REMOVE';
var INFO_EVENT_TYPE='INFO';

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
   
function annoDump() {
  var p=myAnno.getAnnotations();
  var len=p.length;
  var tmp="";
  for(var i=0; i < len; i++) {
      tmp=tmp + annoLog(p[i],INFO_EVENT_TYPE);
  }
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

function annoSetup(_anno,_viewer) {
  _anno.makeAnnotatable(_viewer);
  _anno.addHandler("onAnnotationCreated", function(target) {
    var item=target;
    var json=annoLog(item,CREATE_EVENT_TYPE);
  });
  _anno.addHandler("onAnnotationRemoved", function(target) {
    var item=target;
    var json=annoLog(item,REMOVE_EVENT_TYPE);
    makeDummy();
  });
  _anno.addHandler("onAnnotationUpdated", function(target) {
    var item=target;
    var json=annoLog(item,UPDATE_EVENT_TYPE);
  });
  myAnno=_anno;
}

function annoInject(item, item2) {
  printDebug("======");
  if( annoExist(item) ) { 
    return;
  }
  myAnno.addAnnotation(item);

/* following did not work..
  annoDump();
  printDebug("XXXXXXX");
  myAnno.addAnnotation(item2,item);
  annoDump();
*/
}

// only shape supported is rect
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

  var _w2= _width *2;
  var _h2= _height/2;
  var myAnnotation2 = {
    src : _src,
    context : _context,
    text : _text+"and a new one..",
    shapes : [{
      type : 'rect',
      geometry : { x : _x, y: _y, width : _w2, height: _h2 }
    }]
  } 

  annoInject(myAnnotation, myAnnotation2);
}

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

function annoLog(item, eventType) {
   var hash=getHash(item);
   var data = { src:item.src,
                context:item.context,
                text:item.text,
                shape:item.shapes[0].type,
                x: item.shapes[0].geometry.x,
                y: item.shapes[0].geometry.y,
                width: item.shapes[0].geometry.width,
                height: item.shapes[0].geometry.height
              };
   var tmp= { type: 'openseadragon_dzi',
              id : hash,
              event : eventType,
              data : data
            };

   var json = JSON.stringify(tmp,null,2);
  
/* if data has url embedded in there. need to escape with
encoded = encodeURIComponent( parm )
*/
   if( debug ) {
      printDebug(json);
      } else {
        alertify.confirm(json);
   }
   return json;
}

function annotate() {
  var button = document.getElementById('map-annotate-button');
  button.style.color = '#777';

  myAnno.activateSelector(function() {
    // Reset button style
    button.style.color = '#fff';
  });
}

function annoBtnEnter() {
   annoBtnFadeIn();
}

function annoBtnExit() {
}

function annoBtnFadeOut() {
//window.console.log("-->calling fadeOut..");

  var $button = $("#map-annotate-button");

  if ($button.is(':hover')) {
//window.console.log("..don't fade..");
  } else {
    $button.fadeOut(2000);
//window.console.log("..fading for sure..");
  }

}

function annoBtnFadeIn(){
  var $button = $("#map-annotate-button");
  $button.fadeIn("fast");
}

