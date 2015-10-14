/* 
url=>http://localhost/tiletiff/data/real3/DZI/ImageProperties.xml
*/
var myViewer=null;
var layers = { };

jQuery(document).ready(function() {
  window.console.log("document is ready..");
  myViewer = OpenSeadragon({
                   id: "openseadragon",
                   prefixUrl: "images/",
//                 debugMode: "true",
                   showNavigator: "true",
                   constrainDuringPan: true,
                   visibilityRatio: 	1,
             });
   if (typeof annoSetup === "function") {
     annoSetup(anno,myViewer);
   }

});

// increment one layer with the latest..
function _add2LayerSelect(name) {
  var layers = document.getElementById('inputLayer');
  var newopt = document.createElement('option');
  var v=layers.length;
  newopt.text=name+"_"+v;
  newopt.value=v;
  layers.add(newopt);
}
function _remove2LayerSelect(opt) {
  var layers = document.getElementById('inputLayer');
  if(layers.length > 0) {
    layers.remove(opt);
    layers.selectedIndex=0;
  }
}

function _addPNGLayer( pngName ) {
  var pngName='data/'+pngName+'.png';
  var options = {
     tileSource: {
                   type: 'legacy-image-pyramid',
                   levels:[{
                     url: pngName,
                     height: 1000,
                     width:  1000
                   }]
                 },
     opacity: getOpacity()
                };
   myViewer.addTiledImage( options );
   _add2LayerSelect(pngName);
}

function _addURLLayer(url) {
  window.console.log("got url => "+url);
  var e = ckExist(url);
  var r = extractInfo(e); 
  if( r != null) {
    var name=_getName(url);
    var _height=r[0];
    var _width=r[1];
    var _tileWidth=r[2];
    var _tileHeight=r[3];
    var _minLevel=r[4];
    var _maxLevel=r[5];
    var _dir=r[6];
    var _realMin=_minLevel;
//this is needed because there is no level 0
    if(_minLevel != 0)
      _realMin = _minLevel+1;
              
    path = url.replace('/ImageProperties.xml','');
    if(_dir.split('/').length > 1) {
      if(_dir.search('http')==0) {
        path = _dir;
      }
      } else {
        if(url.search(_dir) == -1) {
          alertify.error("data jpegs should be at the same level as ImageProperties.xml");
        }
    }
    var options = {
                  tileSource: {
                     height: _height,
                     width:  _width,
                     tileWidth: _tileWidth,
                     tileHeight: _tileHeight,
                     minLevel: _minLevel,
                     maxLevel: _maxLevel,
                     getTileUrl: function( level, x, y ) {
                       t=path+'/'+(level)+"/"+x+"_"+y+".jpg";
                       return t;
                   }},
                   defaultZoomLevel: _realMin,
                   opacity: getOpacity()
                   };
   myViewer.addTiledImage( options );
   _add2LayerSelect(name);
   }
}

function ckExist(url) {
  var http = new XMLHttpRequest();
  http.onload = function () {
    window.console.log(http.responseText);
  }
  http.open("GET", url, false);
  http.send();
  if(http.status!=404)
      return http.responseText;
      else return null;
};

function extractInfo(str) {
  if (window.DOMParser) {
      parser=new DOMParser();
      xmlDoc=parser.parseFromString(str,"text/xml");
      } else { // Internet Explorer
          xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async=false;
          xmlDoc.loadXML(str); 
  }
  imageElem= xmlDoc.getElementsByTagName("IMAGE_PROPERTIES");

  var _h=imageElem[0].getAttribute("HEIGHT");
  if(_h != null)
     _h=parseInt(_h);
     else alertify.error("Error: DZI image must have a height");

  var _w=imageElem[0].getAttribute("WIDTH");
  if(_w != null)
     _w=parseInt(_w);
     else alertify.error("Error: DZI image must have a width");

  var _tw=imageElem[0].getAttribute("TILEWIDTH");
  var _th=imageElem[0].getAttribute("TILEHEIGHT");
  if( _tw == null || _th == null) {
     alertify.error("Error: DZI image must have tileWidth & tileHeight");
     } else {
       _tw=parseInt(_tw,10);
       _th=parseInt(_th,10);
  }

  var _min=imageElem[0].getAttribute("MINLEVEL");
  if(_min != null)
     _min=parseInt(_min);
     else alertify.error("Error: DZI image must have a minimum Level");

  var _max=imageElem[0].getAttribute("MAXLEVEL");
  if(_max != null)
     _max=parseInt(_max);
     else alertify.error("Error: DZI image must have a maximum Level");

  var _dir=imageElem[0].getAttribute("DATA");
  if(_dir == null)
     alertify.error("Error: DZI image must have a data directory name");

  if(_h == null || _w == null || _tw == null || _th == null ||
        _min == null || _max == null || _dir == null )
     return null; 

  return [_h,_w,_tw,_th,_min,_max,_dir];
}

function getOpacity() {
  var pElm = document.getElementById('inputOpacity');
  return parseFloat(pElm.value);
}

function _removeLayer(layerID) {
  var _l=parseInt(layerID);
  var item=myViewer.world.getItemAt(layerID);
  myViewer.world.removeItem(item);
  _remove2LayerSelect(layerID);
  var p= myViewer.world.getItemCount();
  window.console.log("_removeLayer, new number of layers: "+p);
}

function removeLayer() {
  var pElm = document.getElementById('inputLayer');
  window.console.log("remove .. layerId is "+pElm.selectedIndex);
  _removeLayer(pElm.selectedIndex);
}

function _spreadLayer(layerID) {
  var _l=parseInt(layerID);
  var p= myViewer.world.getItemCount();
  if(_l < p) {
    var item=myViewer.world.getItemAt(layerID);
    window.console.log("reposition item "+layerID);
    item.setPosition(new OpenSeadragon.Point(_l+1, 0),true);
  } else {
    window.console.log("spreadLayer.. not on list.");
  }
}
function _updateOpacity(layerID, newOpacity) {
  var item=myViewer.world.getItemAt(layerID);
  window.console.log("update original opacity is "+item.getOpacity()+" to "+newOpacity+ "for layer "+layerID);
  item.setOpacity(newOpacity);
}

function _getName(str) {
/* if there is a '/DZC/' */
  if(str.search('/DZC/') != -1) {
    var res = str.split("DZC");
/* res[1] -> /DAPI/ImageProperties.xml */
    var name =  res[1].split("/")[1];
    return name;
  } else {
    var res = str.split("/DZI");
    var name =  res[0].split("/").pop();
    return name;
  }
  return 'UNKNOWN';
}

function _chkHTTP(str) {
  var idx=str.search('^http');
  if(idx==0) {
    return true;
  } else {
    return false;
  }
}
function addData() {
  var canvas = document.getElementsByTagName("canvas")[0];
  var url = canvas.toDataURL();
  window.console.log(url);
  var pElm = document.getElementById('inputURL');
  window.console.log("this is "+pElm.value);
  if(_chkHTTP(pElm.value)) {
    _addURLLayer(pElm.value);
    } else {
      _addPNGLayer(pElm.value);
  }
}

function spreadLayer() {
  var pElm = document.getElementById('inputLayer');
  window.console.log("input .. layerId is "+pElm.value);
  _spreadLayer(pElm.value);
}

function chkInfo() {
  var p= myViewer.world.getItemCount();
  window.console.log("===INFO===");
  window.console.log("number of layers: "+p);
  for( var i=0;i<p; i++) {
    var item=myViewer.world.getItemAt(i);
    window.console.log("item->"+i);
    window.console.log("  opacity"+item.getOpacity());
  }
  window.console.log("==========");
}

function updateOpacity() {
  var pElm = document.getElementById('inputLayer');
  var pOpacity = document.getElementById('updateOpacity');
  _updateOpacity(pElm.value, pOpacity.value);
}
            


