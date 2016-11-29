

//https://oliverbinns.com/articles/rasterising-SVG-in-the-browser/

function scaling(paperSize, printDPI, svgMaxDim) {
//Get paper sizes (long edge)
  if(paperSize == "A4")   {paperInches = 11.7};
  if(paperSize == "A3")   {paperInches = 16.5};
  if(paperSize == "A0")   {paperInches = 46.8};

  //Set scaling factor
  var pixelTarget = paperInches * printDPI,
      scaleFactor = (pixelTarget / svgMaxDim);

  return scaleFactor;
}


function setupSVG()
{
// overlay -> svg -> g
  var overlay=myViewer.svgOverlay();
  var n=overlay.node(); // the g node
  var svg = d3.select('svg');
//  d3.select('svg').attr('id','mySVG');
  var nm = d3.select('svg').attr('id');
window.console.log("name is..",nm);
  window.console.log("SVG's basic information");
}




function convertSVG()
{
// var scaleFactor=scaling(paperSize, printDPI, svgMaxDim);
  var scaleFactor=scaling("A4", 1000, 300);
window.console.log("scale factor..", scaleFactor);

  var SVGstring = $("#SVGholder")[0].innerHTML;
// if SVGstring is encapsulated with ", needs to remove it
  var a=SVGstring.substring(0,1);
//window.console.log("printing a ..(",a,")");

  if(a != '<') {
     var l=SVGstring.length;
     SVGstring=SVGstring.substring(1,l-1);
window.console.log("new one..",SVGstring);
  }
  var canv=$('#canv')[0];

var s = $("#SVGbox");
var swidth=s.width();
var sheight=s.height();

  $('#canv')
    .width(500)
    .height(500);

  canvgOptions = {
    scaleWidth: swidth, 
    scaleHeight: sheight,
    ignoreDimensions: true,  
    renderCallback: canvRenderDone   
    };

  canvg(canv, SVGstring, canvgOptions);
}

function canvRenderDone()
{
  var canv2=$('#canv')[0];
  var img = canv2.toDataURL( "image/png" );
  var dload = document.createElement('a');
  dload.href = img;
  dload.download = "foo.png";
  dload.innerHTML = "Download Image File";
  dload.style.display = 'none';
  document.body.appendChild(dload);
  dload.click();
  delete dload;
}
 


