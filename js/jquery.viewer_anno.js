
/* functions related to annotorious */

var myHovering=false;
var myAnno=null;

function annoDump() {
//  var json=annoMakeJson(myAnno);
  var p=myAnno.getAnnotations();
  alertify.success("got "+p.length+" annotations..");
  var i=p[0];
}

function annoSetup(_anno,_viewer) {
  _anno.makeAnnotatable(_viewer);
  _anno.addHandler("onAnnotationCreated", function(target) {
    var item=target;
    annoPrint(item);
    var p=_anno.getAnnotations();
  });
  myAnno=_anno;
}

function annoMakeJson() {
  var a=myAnno.getAnnotations();
  return a;
}

function annoLoadJson(json) {
}

function annoMakeAnno()
{
var myAnnotation = {
  /** The URL of the image where the annotation should go **/
  src : 'http://www.example.com/myimage.jpg',

  /** The annotation text **/
  text : 'My annotation',

  /** The annotation shape **/
  shapes : [{
    /** The shape type **/
    type : 'rect',

    /** The shape geometry (relative coordinates) **/
    geometry : { x : 0.1, y: 0.1, width : 0.4, height: 0.3 }
  }]
} 
}

function annoPrint(item) {
   var msg=  "src is =>"+item.src+ "<br/>";
   msg= msg+ "context is =>"+item.context+ "<br/>";
   msg= msg+ "text is =>"+item.text+ "<br/>";
   msg= msg+ "shapes is =>"+item.shapes[0].type + "<br/>";
   msg= msg+ "x,y is =>"+item.shapes[0].geometry.x +
                     " "+ +item.shapes[0].geometry.y + "<br/>";
   msg= msg+ "height,width is =>"+item.shapes[0].geometry.height +
                     " "+ +item.shapes[0].geometry.width + "<br/>";
   alertify.confirm(msg);
}

function annotate() {
window.console.log("click on annotate..");
  var button = document.getElementById('map-annotate-button');
  button.style.color = '#777';

  myAnno.activateSelector(function() {
    // Reset button style
    button.style.color = '#fff';
  });
}

function annoBtnEnter() {
   myHovering=true;
   annoBtnFadeIn();
}

function annoBtnExit() {
   myHovering=false;
}

function annoBtnFadeOut() {
window.console.log("calling fadeOut..");

  if(myHovering == true) {
window.console.log("(don't fade), hovering is "+myHovering);
    return;
  }
  var $button = $("#map-annotate-button");
  if( ($button).is(":hover") ){
      window.console.log("SKIP OUT...");
      return;
  }
  $button.fadeOut(2000);
}

function annoBtnFadeIn(){
  var $button = $("#map-annotate-button");
  $button.fadeIn("fast");
}

