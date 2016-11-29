
//
var overlayToggle=false;
var overlayList=[];
var overlayTextList=[];
var overlayLoaded=false;

function convertData(a,_xscale,_yscale) {
   var polyViewportData=[];
   if( a.constructor === Array) {
     var len=a.length;
     for(var i=0;i<len;i++) {
       var p= myViewer.viewport.imageToViewportCoordinates(
             new OpenSeadragon.Point(a[i].x/_xscale,
                                     (a[i].y/_yscale)* -1));
       polyViewportData.push({ x:p.x, y:p.y});
     }
     } else { // just one set
       var p= myViewer.viewport.imageToViewportCoordinates(
             new OpenSeadragon.Point(a.x/_xscale,
                                     (a.y/_yscale)* -1));
       polyViewportData.push({ x:p.x, y:p.y});
   }
   return polyViewportData;
 
}

function getRandom() { return Math.random(); }

function calcFromPixel(fs) {
window.console.log("calcFrompixel..", fs);
  var pos1= new OpenSeadragon.Point(0,0);
  var vPt1 = myViewer.viewport.pointFromPixel(pos1);
  var pos2= new OpenSeadragon.Point(fs,0);
  var vPt2 = myViewer.viewport.pointFromPixel(pos2);
  var p=Math.abs(vPt2.x - vPt1.x);
window.console.log("new val is", p);
  return p;
}

function calcThickness(t,xscale) {
   window.console.log("thickness=>", t);
   var pp=calcFromPixel(parseFloat(t)*xscale);
   window.console.log(pp);
   return pp;
}

function overlayClick() {
   var otog = document.getElementById('overlay-toggle');
   overlayToggle = !overlayToggle;
   if(overlayToggle) {
      otog.style.color='blue';
      if(overlayLoaded) { // just load it once
        enableAllOverlays();
        return;
      } 
      overlayLoaded=true;
// make sure svg has a 'name-label' to it
//      setupSVG();
      if(saveOverlayTexts.length>0) {
        var tlen=saveOverlayTexts.length;
        for(var i=0;i<tlen;i++) {
          var name="myText_"+i;
          var _set=saveOverlayTexts[i];
          var xscale=parseFloat(_set['xscale']);
          var yscale=parseFloat(_set['yscale']);
          var color=_set['color'];
          var points=_set['points'];
          var ndata=convertData(points,xscale,yscale);
          var fontType=_set['fontType'];
          // need to convert from pixel to viewport distance
          var fontSize=parseInt(_set['fontSize']);
          fontSize=calcFromPixel(fontSize);
          var text=_set['text'];
          var d=ndata[0];
          addTextOverlays(name,d.x,d.y,text,color,fontType,fontSize);
        }
      }
      if(saveOverlayShapes.length>0) {
        var slen=saveOverlayShapes.length;
        for(var i=0;i<slen;i++) {
           var name="myShapes"+i;
           var _set=saveOverlayShapes[i];
           var xscale=parseFloat(_set['xscale']);
           var yscale=parseFloat(_set['yscale']);
           var color=_set['color'];
           var points=_set['points'];
           var ndata=convertData(points,xscale,yscale);
           var _thickness=calcThickness(points[0].d, xscale);
           if(points.length>2) {
             addPolygonOverlays(name,ndata,_thickness,color);
           } else {
             var d=ndata[0];
             addCircleOverlays(name,d.x,d.y,_thickness,1,color);
           }
         }
      }
//      convertSVG();
      } else {
        disableAllOverlays();
        otog.style.color='black';
   }
}


/*****************************************************************/

function addRectOverlays(name,_x,_y,_dx,_dy,_o,_c) {
  var overlay=myViewer.svgOverlay();
  var d3Rect = d3.select(overlay.node()).append("rect")
                        .style('fill', _c)
                        .style('fill-opacity', _o)
                        .attr("id",name)
                        .attr("x", _x)
                        .attr("width", _dx)
                        .attr("y", _y)
                        .attr("height", _dy);

  $(window).resize(function() { overlay.resize()});
  overlayList.push("#"+name);
}


// the _r is so small..
function addCircleOverlays(name,_cx,_cy,_r,_o,_c) {
  var overlay=myViewer.svgOverlay();
  var d3Circle=d3.select(overlay.node()).append("circle")
            .style('fill',"white")
            .style('fill-opacity', _o)
            .attr("id",name)
            .attr('cx', _cx)
            .attr('cy', _cy)
            .attr('r', _r*3)

  var d3CircleInside=d3.select(overlay.node()).append("circle")
            .style('fill',_c)
            .style('fill-opacity', _o)
            .attr("id",name+"_inner")
            .attr('cx', _cx)
            .attr('cy', _cy)
            .attr('r', _r*2)
            .on('mouseout', function(){
window.console.log("on a circle..");
                var tnode=d3.select("#"+name).node();
                tnode.style.fill="white";
            })
            .on('mouseover', function(){
window.console.log("over a circle..");
               var tnode=d3.select("#"+name).node();
               tnode.style.fill="yellow";
            });

/*
  overlay.onClick(d3Circle.node(), function() {
       var msg=" a circle node is clicked "+name;
       window.console.log("click on circle");
       alertify.confirm(msg);
  });
*/

  $(window).resize(function() { overlay.resize()});
  overlayList.push("#"+name);
  overlayList.push("#"+name+"_inner");
}


function addLineOverlays(name, _x1,_y1,_x2,_y2,_t,_o,_c) {
  var overlay=myViewer.svgOverlay();
  var d3Line=d3.select(overlay.node()).append("line")
            .attr("id",name)
            .style('opacity', _o)
            .attr('x1', _x1)
            .attr('y1', _y1)
            .attr('x2', _x2)
            .attr('y2', _y2)
            .attr('stroke-width',_t)
            .attr('stroke',_c);

/*
  overlay.onClick(d3Line.node(), function() {
       window.console.log("click on line");
  });
*/

  $(window).resize(function() { overlay.resize()});
  overlayList.push("#"+name);
}


function addPolygonOverlays(name,_dlist,_t,_c) {
window.console.log("adding a polygon...");

//var pathFunc = d3.line().curve(d3.curveCardinal.tension(0.5))
var pathFunc = d3.line()
                 .x(function(d) { return d.x; })
                 .y(function(d) { return d.y; })
                 .curve(d3.curveLinearClosed);

  var pp=pathFunc(_dlist);
  window.console.log(pp);

window.console.log("width of the polygon is..",_t);

  var overlay=myViewer.svgOverlay();
  var d3Polygon=d3.select(overlay.node()).append("path")
               .attr("id",name)
               .attr("d", pathFunc(_dlist))
               .attr('stroke-width',_t)
               .attr('stroke','white')
               .style('fill','none');
//               .style('fill-opacity', 0.2)
//               .style("fill", function(d) { return "#f00"; });

  var d3PolygonInside=d3.select(overlay.node()).append("path")
               .attr("id",name+"_inner")
               .attr("d", pathFunc(_dlist))
               .attr('stroke-width',_t/2)
               .attr('stroke',_c)
//               .style('fill','none')
               .style('fill-opacity', 0.2)
               .style("fill", function(d) { return "#f00"; })
               .on('mouseover', function(){
                  var tnode=d3.select("#"+name).node();
//                  var tnode=this;
                  tnode.style.stroke="yellow";
window.console.log("-> catching on the mouseover on polygon...");
               })
               .on('mouseout', function(){
                  var tnode=d3.select("#"+name).node();
                  //var tnode=this;
                  tnode.style.stroke="white";
               });


/*
    var pnode=d3PolygonInside.node();
    $(pnode).mouseover(
       function(evt) {
var t=evt.target;
if(t.style.stroke =="red")
  t.style.stroke = "yellow";
  else 
    t.style.stroke = "red";
//$(this).css({"stroke":"red"}).hide(100).show(100).css({"stroke":"yellow"});
    });
*/

  $(window).resize(function() { overlay.resize()});
  overlayList.push("#"+name);
  overlayList.push("#"+name+"_inner");
}

function addTextOverlays(name,_x,_y,_t,_c,_ft,_fs) {
  var overlay=myViewer.svgOverlay();

  var outside=d3.select(overlay.node());

window.console.log("_x and _y ", _x," ",_y);
//;transform", function(d, i) { return "translate(0,0)"; });
  var d3Text=outside.append("text")
               .attr("id",name)
               .attr("x", _x)
               .attr("y", _y)
               .text(_t)
               .attr("font-family", _ft)
               .attr("font-size", _fs)
               .attr("fill", _c);

// can not click on a text node because it includes the whole 
// svg canvas area
// how to figure out the bounding box of a text
//  var dnode=d3Text.node();
//  var bBox = dnode.getBBox();
//window.console.log('XxY', bBox.x + 'x' + bBox.y);
//window.console.log('size', bBox.width + 'x' + bBox.height);

  $(window).resize(function() { overlay.resize()});
  overlayTextList.push("#"+name);
}

function enableAllOverlays() {
  var v=myViewer;
  var overlay=myViewer.svgOverlay();
  var len=overlayList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayList[i]).attr("display", "");
  } 
  len=overlayTextList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayTextList[i]).attr("display", "");
  } 
  enableTextOverlays();
}

function disableAllOverlays() {
  var v=myViewer;
  var overlay=myViewer.svgOverlay();
  var len=overlayList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayList[i]).attr("display", "none");
  } 
  disableTextOverlays();
}

function enableTextOverlays() {
  var v=myViewer;
  var overlay=myViewer.svgOverlay();
  var len=overlayTextList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayTextList[i]).attr("display", "");
  } 
}

function disableTextOverlays() {
  var v=myViewer;
  var overlay=myViewer.svgOverlay();
  var len=overlayTextList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayTextList[i]).attr("display", "none");
  } 
}

function removeAllOverlays() {
  var v=myViewer;
  var overlay=myViewer.svgOverlay();
  var len=overlayList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayList[i]).remove();
  } 
  overlayList=[];
}

/*** this is for working with canvg                              **/
// https://oliverbinns.com/articles/rasterising-SVG-in-the-browser/
function foo()
{  

  var overlay=myViewer.svgOverlay();
  var svgString = overlay.innerHTML;
  var s = $('#svgDrawing');
  canvg(canv, svgString, canvgOptions);
}
