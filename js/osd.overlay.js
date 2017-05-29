
//

var overlayToggle=false;
var overlayList=[];
var overlayTextList=[];
var overlayLoaded=false;

// overlaySVGLayerList->({layerid:layerid, layer:name, opacity:pval, color:cval });
// overlaySVGPathList->({ layerid:layerid, group:name, path:pname, node:d3Path});
var overlaySVGPathList=[];
var overlaySVGLayerList=[];

/*
#FF0000    red(1.00, 0, 0),
#FFCC66    orange (1.00, 0.80, 0.40)
#009600    green (0, 0.592, 0)
#868600    mustard (0.527, 0.527, 0)
#008E8E    cyan (0, 0.559, 0.559)
#5050FC    blue (0.316, 0.316, 0.991)
#B700B7    magenta (0.718, 0, 0.718)
var defaultColor=[ [1.00, 0, 0],
                   [1.00, 0.80, 0.40],
                   [0, 0.592, 0],
                   [0, 0.559, 0.559],
                   [0.718, 0, 0.718],
                   [0.527, 0.527, 0],
                   [0.316, 0.316, 0.991]];
*/
var defaultColor=[ "#FF0000", "#FFCC66", "#009600",
"#868600", "#008E8E", "#5050FC", "#B700B7"];

// just in case my defaultColor is too little
function getDefaultColor(p) {
  var len=defaultColor.length;
  var t= (p+len) % len;
  return defaultColor[t];
}

var colorCounter=0;

/* convert path data,  
   M x y
   L x y
   H x
   V y
   C x y x y
   S x y x y
   Q x y x y
   T x y x y
   ... https://www.w3.org/TR/SVG/paths.html#PathDataGeneralInformation
*/
// convert Xs,Ys
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
  var pos1= new OpenSeadragon.Point(0,0);
  var vPt1 = myViewer.viewport.pointFromPixel(pos1);
  var pos2= new OpenSeadragon.Point(fs,0);
  var vPt2 = myViewer.viewport.pointFromPixel(pos2);
  var p=Math.abs(vPt2.x - vPt1.x);
//window.console.log("new fontsize is", p," from ",fs);
  return p;
}

function calcThickness(t,xscale) {
//   window.console.log("thickness=>", t);
   var pp=calcFromPixel(parseFloat(t)*xscale);
   return pp;
}

function overlayClick() {
   var otog = document.getElementById('overlay-toggle');
   overlayToggle = !overlayToggle;
   if(overlayToggle) {
      otog.style.color='blue';
      if(overlayLoaded) { // just load it once and setup pullout
        enableAllOverlays();
        return;
      } 
      overlayLoaded=true;
// make sure svg has a 'name-label' to it
//      setupSVG();

      if(saveOverlayGroups.length>0) {
        var glen=saveOverlayGroups.length;
        for(var i=0;i<glen;i++) {
          var _set=saveOverlayGroups[i];
          var _gname=_set['gname'];
          var _layerid=parseInt(_set['layerid']);
          var _width=parseFloat(_set['width']);
          var _xscale=parseFloat(_set['xscale']);
          var _yscale=parseFloat(_set['yscale']);
          var _paths=_set['paths'];
          // need to convert from pixel to viewport distance
          addGroupOverlays(_layerid,_gname,_width,_xscale,_yscale,_paths);
        }
      }
      setupOverlaySelect();

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
//window.console.log("on a circle..");
                var tnode=d3.select("#"+name).node();
                tnode.style.fill="white";
            })
            .on('mouseover', function(){
//window.console.log("over a circle..");
               var tnode=d3.select("#"+name).node();
               tnode.style.fill="yellow";
            });

  overlay.onClick(d3CircleInside.node(), function() {
       var msg=" a circle node is clicked "+name;
//       window.console.log("click on circle");
       alertify.confirm(msg);
  });

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

  overlay.onClick(d3Line.node(), function() {
       var msg=" a line node is clicked "+name;
//       window.console.log("click on a line");
       alertify.confirm(msg);
  });

  $(window).resize(function() { overlay.resize()});
  overlayList.push("#"+name);
}


function addPolygonOverlays(name,_dlist,_t,_c) {
//window.console.log("adding a polygon...");

//var pathFunc = d3.line().curve(d3.curveCardinal.tension(0.5))
var pathFunc = d3.line()
                 .x(function(d) { return d.x; })
                 .y(function(d) { return d.y; })
                 .curve(d3.curveLinearClosed);

  var pp=pathFunc(_dlist);

//window.console.log("width of the polygon is..",_t);

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
//window.console.log("-> catching on the mouseover on polygon...");
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

  overlay.onClick(d3Polygon.node(), function() {
       var msg=" a polygon border is clicked "+name;
//       window.console.log("click on polygon border");
       alertify.confirm(msg);
  });

  overlay.onClick(d3PolygonInside.node(), function() {
       var msg=" a polygon is clicked "+name;
//       window.console.log("click on polygon ");
       alertify.confirm(msg);
  });

  $(window).resize(function() { overlay.resize()});
  overlayList.push("#"+name);
  overlayList.push("#"+name+"_inner");
}

// add to <svg> instead of under the <g>
function addTextOverlays(name,_x,_y,_t,_c,_ft,_fs) {
  var overlay=myViewer.svgOverlay();

//window.console.log("XX _fs is ",_fs);
//window.console.log("XX _x is ", _x);
//window.console.log("XX _y is ", _y);

  var d3Text = d3.select(overlay._svg).append("text")
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

// in svg input file, path are under some group node
// Path is put in under the local group
// and a layer could have several groups
function addPathOverlays(d3Group,layerid,name,pname,_c, _op, _d) {
  var overlay=myViewer.svgOverlay();
  var gnode=d3Group;

  if(gnode == null) {
    gnode=d3.select(overlay.node());
  }
  var d3Path=gnode.append("path")
        .attr("id", pname)
        .attr("fill",_c)
        .attr("opacity",_op)
        .attr("d",_d);

  overlaySVGPathList.push({ layerid:layerid, group:name, path:pname, node:d3Path});

  overlay.onClick(d3Path.node(), function() {
       var msg="a path node is clicked "+pname;
//       window.console.log("click on a group");
       alertify.confirm(msg);
  });

}

// adding a group of svg paths
function addGroupOverlays(_layerid,name,_width,_xscale, _yscale, _plist) {
//window.console.log("adding a group of svg paths...");

  var overlay=myViewer.svgOverlay();
  var gnode=overlay.node();

// -> translate(xloc, yloc) scale(scale)
// -> "translate(83.66411378555806,0) scale(869.6717724288839) rotate(0)"
  var transform=gnode['attributes'][0];

// this is the trick so I don't have to rescale the position values in svg path
  var descale=1/_width;
  var transform="translate(0,0) scale("+descale+") rotate(0)";

  var len=_plist.length;
  if(len < 1)
    return;

  var d3Group=d3.select(overlay.node()).append("g").attr("id",name).attr("transform", transform);

  var color=getColorByLayerid(_layerid);
  
  for( var i=0;i<len;i++) {
    var p=_plist[i];
//    var color=p['fill'];
    var opacity=p['opacity'];
    var d=p['d'];
    var pname=name+"_"+i;
    addPathOverlays(d3Group,_layerid,name,pname, color, opacity, d);
  }

/*
  overlay.onClick(d3Group.node(), function() {
       var msg=" a group node is clicked "+name;
       window.console.log("click on a group");
       alertify.confirm(msg);
  });
*/

  $(window).resize(function() { overlay.resize()});
  overlayList.push("#"+name);
}

/*******************************************************************/

function enableAllOverlays() {
  var v=myViewer;
  var overlay=myViewer.svgOverlay();
  var len=overlayList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayList[i]).attr("display", "");
  } 
  enableTextOverlays();
}

function disableAllOverlays() {
  var len=overlayList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayList[i]).attr("display", "none");
  } 
  disableTextOverlays();
}

function enableTextOverlays() {
  var len=overlayTextList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayTextList[i]).attr("display", "");
  } 
}

function disableTextOverlays() {
  var len=overlayTextList.length;
  for(var i=0; i<len;i ++) {
    d3.select(overlayTextList[i]).attr("display", "none");
  } 
}

function removeAllOverlays() {
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


/*****************handle sidebar ****************************/
// this is svg layers sidebar
var layers_sidebar=false;

function layersClick()
{
  layers_sidebar = !layers_sidebar;
  if(layers_sidebar) {
    sidebar_layers_slideOut();
    } else {
      sidebar_layers_slideIn();
  }
}

function dismissLayers() {
  layersClick();
}


// svg path

/*
   going into layerid, iterate through paths
overlaySVGPathList->({ layerid:layerid, group:name, path:pname, node:d3Path});
*/
function addPathListLayer(layerid) {
   var g=getPathsByLayerid(layerid);
   var l=g.length;
   for(var i=0; i<l;i++) {
     var p=g[i];
     var pname=p['path'];
     var op=_getPathOpacityById(pname);
     addPathListEntry(n,i,op);
   }
}

// iterate through all the pathlist, if id match, then update the
// opacity of the path id
function _updateLayerOpacity(layerid,op) {
   var g=getPathsByLayerid(layerid);
   var l=g.length;
   for(var i=0; i<l;i++) {
     var p=g[i];
     var pname=p['path'];
     var _s='#'+pname;
     $(_s).attr('opacity',op);
   }
 
   var layer=getLayerByLayerid(layerid);
   var layername=layer['layer'];
   updateLayerSliders(layername,op);
}

function getLayerByLayerlabel(name) {
  var plen=overlaySVGLayerList.length;
  for(var i=0; i<plen;i++) {
    var l=overlaySVGLayerList[i];
    if(l['layer'] == name)
      return l;
  }
  return null;
}

function getColorByLayerid(id) {
  var plen=overlaySVGLayerList.length;
  for(var i=0; i<plen;i++) {
    var l=overlaySVGLayerList[i];
    if(l['layerid'] == id)
      return l['color'];
  }
  return null;
}

function getLayerByLayerid(id) {
  var plen=overlaySVGLayerList.length;
  for(var i=0; i<plen;i++) {
    var l=overlaySVGLayerList[i];
    if(l['layerid'] == id)
      return l;
  }
  return null;
}

function getPathsByLayerid(layerID) {
  var plen=overlaySVGPathList.length;
  var plist=[];
  for (var i = 0; i < plen; i++) {
    var p=overlaySVGPathList[i];
    var _id= parseInt(p['layerid']);
    if (_id==layerID) {
      plist.push(p);
    }
  }    
  return plist;
}

// layer's opacity slider
function setupLayerSlider(layername,layerid,pval) {
  var _s='#'+layername+'_layer_opacity_slider';
  var _sb=layername+'_layer_opacity_slider_btn';

  var sbtn=document.getElementById(_sb);
  jQuery(_s).slider({
      slide: function( event, ui ) {
        sbtn.value=ui.value;
        _updateLayerOpacity(layerid, ui.value);
      }
  });

  jQuery(_s).width(100 + '%');
  jQuery(_s).slider("option", "value", pval); // by default
  jQuery(_s).slider("option", "min", 0.1);
  jQuery(_s).slider("option", "max", 1);
  jQuery(_s).slider("option", "step", 0.1);

  // do the initial update
  _updateLayerOpacity(layerid, pval);
}

function updateLayerSliders(name,pval) {
  var _s='#'+name+'_layer_opacity_slider';
  var _sb=name+'_layer_opacity_slider_btn';

  var sbtn=document.getElementById(_sb);
  sbtn.value=pval;
  jQuery(_s).slider("option", "value", pval); // by default
}


// overlaySVGLayerList->({ layerid:layerid, layer:name, opacity:pval, color:cval });
// overlaySVGPathList->({ layerid:layerid, group:name, path:pname, node:d3Path});
function setupOverlaySelect() {
  var llen=overlaySVGLayerList.length;
  for(var i=0; i< llen; i++) {
     // a svg layer
     var o=overlaySVGLayerList[i];
     var _id=o['layerid'];
     var _n=o['layer'];
     var _op=o['opacity'];
     var _c=o['color'];

     addLayerListEntry(_n,_id,_op,_c);
     setupLayerSlider(_n,_id,_op);
  }
}

// toggle visibility of layer
// overlaySVGLayerList->({ layerid:layerid, layer:name, opacity:pval });
// overlaySVGPathList->({ layerid:layerid, group:name, path:pname, node:d3Path});
function toggleLayer(idx, layerLabel, sliderDiv) {
  var layer=getLayerByLayerid(idx);
  var tmp='#'+layerLabel;
  var sDiv=idx+'_layer_opacityDiv';
  var eptr = $(tmp);
  var name=layer['layer'];
  var _id=layer['layerid'];
  var _btn=sliderDiv;
  var open=eptr.hasClass('glyphicon-eye-open');
  if (open) {
    eptr.removeClass('glyphicon-eye-open').addClass('glyphicon-eye-close');
    updateLayerVisibility(idx,true);
    document.getElementById(_btn).disabled=true;
    document.getElementById(_btn).style.color="grey";
// if the task slider is open, close it,--
window.console.log("sDiv is.. ",sDiv);
    document.getElementById(sliderDiv).style.display = 'none';
    } else {
      eptr.removeClass('glyphicon-eye-close').addClass('glyphicon-eye-open');
      updateLayerVisibility(idx,false);
      document.getElementById(_btn).disabled=false;
      document.getElementById(_btn).style.color="#407CCA";
  }
}

// go down through all the path, and reset the opacity 
// level on all the path's structure
function resetLayer(layerid, layername) {
  var layer=getLayerByLayerid(layerid);
  var pval=layer['opacity']; // pick up original opacity value
  _updateLayerOpacity(layerid,pval);
}


// squeeze out all spaces in name
function addLayerListEntry(n,i,opacity,color) {
  var name = n.replace(/ +/g, "");
  var _name=n;
  var _collapse_name=i+'_layer_collapse';
  var _visible_name=i+'_layer_visible';
  var _opacity_name=i+'_layer_opacity';
  var _task_name=i+'_layer_task';
  var _eye_name=i+'_layer_eye';
  var _reset_slider_name=name+'_layer_slider_reset';
  var _reset_slider_btn=name+'_layer_slider_reset_btn';
  var _opacity_slider_name=name+'_layer_opacity_slider';
  var _opacity_slider_btn=name+'_layer_opacity_slider_btn';
  var _opacity_init_value=opacity;
  var sliderDiv=_opacity_name+'Div';


var _nn='<div class="panel panel-default col-md-12 col-xs-12">';

_nn+='<div class="panel-heading">';
_nn+='<div class="row panel-title" style="background-color:transparent">';

var _b='<button id="'+_visible_name+'" class="pull-left"  style="display:inline-block;outline: none;border:none; background-color:white"  onClick="toggleLayer('+i+',\''+_eye_name+'\',\''+sliderDiv+'\')" title="hide or show layer"><span id="'+_eye_name+'" class="glyphicon glyphicon-eye-open" style="color:'+color+'"></span> </button>';

var _bb='<button id="'+_opacity_name+'" class="pull-left"  style="display:inline-block;outline: none;border:none; background-color:white;"  onClick="opacityLayer(\''+sliderDiv+'\')" title="click to change opacity of layer"><span id="'+_task_name+'" class="glyphicon glyphicon-tasks" style="color:#407CCA"></span> </button>';

_nn+=_b+'<a class="accordion-toggle" data-toggle="collapse" data-parent="#layerList" href="#' +_collapse_name+'" title="click to expand layerlist">'+_bb+'</a><p>'+name+'</p>';

_nn+='</div></div>';
_nn+=' <div id="'+_collapse_name+'" class="panel-collapse collapse">';

// where the slider is
_nn+='<div class="panel-body">';

_nn+='<div class="row col-md-12 col-xs-12">';
_nn+='<button id=\''+_reset_slider_btn+'\' class="pull-right btn btn-xs btn-success" style="font-size:12; margin-bottom:10px; margin-right:-10px;" title="Reset opacity" onclick="resetLayer('+i+',\''+name+'\')">Reset</button></div>'; 

_nn+= '<div id=\''+sliderDiv+'\' class="layercontrol" style="display:none">';
_nn+= '<div class="col-md-12 col-xs-12 layer-slider">';
_nn+='<div class="menuLabel">Opacity<input id="'+ _opacity_slider_btn+'" type="button" class="btn btn-info pull-right" value=1 style="color:black; background:white; height:16px; width:30px; font-size:10px; padding:0px;"></div> <div id="'+ _opacity_slider_name+'" class="o-slider"></div>';
_nn+='</div></div>';
_nn+='<!-- sliderDiv -->';

// last bits
_nn+= '</div> </div> </div> <!-- panel-body --> </div> </div> <!-- panel -->';

  jQuery('#layerList').append(_nn);
window.console.log(_nn);
}

// turn it on
function opacityLayer(sliderDiv) {
  var p=document.getElementById(sliderDiv);
  document.getElementById(sliderDiv).style.display = '';
} 

function updateLayerVisibility(layerid,off) {

  var plist=getPathsByLayerid(layerid);
  var len=plist.length;
  for(var i=0; i<len; i++) {
    var p=plist[i];
    var pnode=p['node'];
    if(off) {
      pnode.attr("display", "none");
      } else {
        pnode.attr("display", "");
    }
  }
} 
