
/* run : 

  http://localhost/tiletiff/mview.html?
         http://localhost/tiletiff/data/DZI/ImageProperties.xml
       or
or
  http://localhost/tiletiff/mview.html?
         http://localhost/tiletiff/data/sample3_DZI/ImageProperties.xml
         &x=0.123&y=1.234&m=2.5
or
  http://localhost/tiletiff/mview.html?
         url=http://localhost/tiletiff/data/first_dzi/ImageProperties.xml
         &url=http://localhost/tiletiff/data/second_dzi/ImageProperties.xml
         &url=http://localhost/tiletiff/data/third_dzi/ImageProperties.xml

http://localhost/tiletiff/mview.html?
 url=http://localhost/data/cirm/real3/DZI/ImageProperties.xml
 &url=http://localhost/data/cirm/real3/DZC/DAPI/ImageProperties.xml
 &url=http://localhost/data/cirm/real3/DZC/Alexa Fluor 488/ImageProperties.xml
 &url=http://localhost/data/cirm/real3/DZC/Alexa Fluor 555/ImageProperties.xml 
(the ImageProperties.xml should be used for our application by default)
*/

/* tracking current location .. */

var myViewer=null;

/* for snap and go buttons */
var snapX=null;
var snapY=null;
var snapZoom=null;

/* tracking current location .. */
var logX=null;
var logY=null;
var logZoom=null;
var logHeader=null;
var logURL=[];

var redColors = ['Rhodamine', 'RFP', 'Alexa Fluor 555', 'Alexa Fluor 594', 'tdTomato', 'Alexa Fluor 633', 'Alexa Fluor 647']
var greenColors = ['FITC', 'Alexa 488', 'EGFP', 'Alexa Fluor 488']
var blueColors = ['DAPI']


var hueList= [];
var invertList = [];
var filterList = [];

var collectionMode=false;

// this is to work around that the initial load of the viewport
// always goes to the initial view first
var startState=false;

jQuery(document).ready(function() {

//process args
//  var args = document.location.search.substring(1).split('?');
  var args= document.location.href.split('?');
  if (args.length != 2) {
      alertify.error("Error: Need to supply an url");
      return;
  }
  logHeader=args[0];

  var params = args[1].split('&');
  for (var i=0; i < params.length; i++)
      {
        param = unescape(params[i]);
  
        if (param.indexOf('=') == -1)
        {
          url=param.replace(new RegExp('/$'),'').trim();
          logURL.push(url);
       } else {
            kvp = param.split('=');
            if(kvp[0].trim() == 'url') {
              url=kvp[1].replace(new RegExp('/$'),'').trim();
              logURL.push(url);
            } else if(kvp[0].trim() == 'x') {
                logX=parseFloat(kvp[1]); 
            } else if(kvp[0].trim() == 'y') {
                logY=parseFloat(kvp[1]); 
            } else if(kvp[0].trim() == 'z') {
                logZoom=parseFloat(kvp[1]); 
            } else {
                var _unknown=kvp[1].replace(new RegExp('/$'),'').trim();
                var _utype=kvp[0].trim();
                alertify.error("Error: Unable to handle param type, "+_utype);
            }
        }
  }
  if(logURL.length == null) {
    alertify.error("Error: Need to supply an url");
  } else {

    myViewer = OpenSeadragon({
                   id: "openseadragon",
                   prefixUrl: "images/",
                   debugMode: "true",
                   showNavigator: "true",
                   constrainDuringPan: true,
                   visibilityRatio:     1,

             });

    if (typeof annoSetup === "function") { 
        annoSetup(anno,myViewer);
    }
    for( i=0; i<logURL.length; i++) { 
       url=logURL[i];
       _addURLLayer(url,i);
    }

    // if logX, logY, logZoom are not null
    if( (logX != null) && (logY != null) && (logZoom !=null)) {
      startState=true;
    }

    // add handlers
      myViewer.addHandler('update-viewport', function(target) {
          if(startState) {
            goPosition(logX,logY,logZoom);
            startState=false;
            } else {
              savePosition();
          }
      });
      myViewer.addHandler('canvas-enter', function(target) {
        /* make it visible */
        if (typeof annoBtnFadeIn === "function") { 
          annoBtnFadeIn();
        }
      });

      myViewer.addHandler('canvas-exit', function(target) {
        /* make it invisible */
        if (typeof annoBtnFadeOut === "function") { 
          annoBtnFadeOut();
        }
      });
/* XXX
      myViewer.addHandler('tile-drawing', function(target) {
window.console.log("--> making call to tile-drawing..");
         var ctxt = viewer.rendered;
      });
*/
   }
});

function _addURLLayer(url, i) {
  var e = ckExist(url);
  if(e==null) {
    alertify.error("Error: Unable to load url, "+url);
    return;
  }
  var r = extractInfo(e); 
  if( r != null) {
    var _name=r['colortype'];
    var _height=r['height'];
    var _width=r['width'];
    var _tileWidth=r['tilewidth'];
    var _tileHeight=r['tileheight'];
    var _levelScale=r['levelscale'];
    var _minLevel=r['minlevel'];
    var _maxLevel=r['maxlevel'];
    var _dir=r['dir'];
    var _realMin=_minLevel;
//this is needed because there is no level 0
    if(_minLevel != 0)
      _realMin = _minLevel+1;
              
    var path = url.replace('/ImageProperties.xml','');
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
                     getLevelScale: function( level ) {
                       var levelScaleCache = {}, i;
                         for( i = 0; i <= _maxLevel; i++ ){
                            levelScaleCache[ i ] = 1 / Math.pow(_levelScale, _maxLevel - i);
                         }
                       this.getLevelScale = function( _level ){
                         return levelScaleCache[ _level ];
                       };
                       return this.getLevelScale( level );
                     },
                     getTileUrl: function( level, x, y ) {
                       t=path+'/'+(level)+"/"+x+"_"+y+".jpg";
                       return t;
                   }},
                   defaultZoomLevel: _realMin,
                   opacity: _initOpacity() 
                   };
     myViewer.addTiledImage( options );
     addItemListEntry(_name,i,[1.00, 0.80, 0.40],_dir)
     if(_name == "unknown") {
       window.console.log("don't know the color type..");
//       invertList.push(i);
     } else if(_name == "combo") {
//       invertList.push(i);
     } else if(blueColors.indexOf(_name) != -1) { 
       hueList.push([i,240]);
     } else if(redColors.indexOf(_name) != -1) {
       hueList.push([i,0]);
     } else if(greenColors.indexOf(_name) != -1) {
       hueList.push([i,120]);
     }
   }
}

function _RGBTohex(rgb) {
   var r=Math.floor(rgb[0] * 255);
   var g=Math.floor(rgb[1] * 255);
   var b=Math.floor(rgb[2] * 255);
   var _hex = '#' + (r==0?'00':r.toString(16))+
               (g==0?'00':g.toString(16))+ (b==0?'00':b.toString(16));
   return _hex;
}

function addItemListEntry(name,i,color,label) {
var _nn='<input type="checkbox" class="mychkbox" style="color:'+_RGBTohex(color)+';" id="'+name+'_'+i+'d" checked="" onClick="toggleItem('+i+','+'\''+name+'\');" /><label for="'+name+'_'+i+'d" >'+name+'</label><br>';
jQuery('#itemList').append(_nn);
//window.console.log(_nn);
}

function addFilters() {
   for(i=0;i<invertList.length;i++) {
     _addInvertFilter(invertList[i]);
   }
   for(i=0;i<hueList.length;i++) {
     var s=hueList[i];
     _addHueFilter(s[0],s[1]);
   }
   myViewer.setFilterOptions({
     filters: filterList
   })
}

function resetAllFilters() {
   var ilist = ( function() {
          var result = [];
          for (var i = 0; i < myViewer.world.getItemCount(); i++) {
            result.push(myViewer.world.getItemAt(i));
          }
          return result;
        })();
   myViewer.setFilterOptions({
    filters: {
        items: ilist,
        processors: [ ] 
    }
   });
}

function _addInvertFilter(ItemID) {
   filterList.push(
      { items: [ myViewer.world.getItemAt(ItemID) ],
        processors: [ OpenSeadragon.Filters.INVERT() ] 
      });
}

function _addHueFilter(ItemID, angle) {
   var p=myViewer.world.getItemAt(ItemID);
   window.console.log("XXX.."+ItemID+" "+angle);
   if(ItemID == 2) {
   filterList.push( {
        items: [myViewer.world.getItemAt(ItemID) ],
        processors: [ OpenSeadragon.Filters.CONTRAST(3),
                      OpenSeadragon.Filters.HUE(angle) ] 
   });
   } else {
   filterList.push( {
        items: [myViewer.world.getItemAt(ItemID) ],
        processors: [ OpenSeadragon.Filters.CONTRAST(2),
                     OpenSeadragon.Filters.HUE(angle) ] 
   });
   }
}

function _initOpacity() {
  return 1;
}

function _updateOpacity(itemID, newOpacity) {
  var item=myViewer.world.getItemAt(itemID);
  item.setOpacity(newOpacity);
//myViewer.forceRedraw();
//myViewer.world.resetItems()

}
function toggleCollectionMode() {
  if(collectionMode == true) {
    var i, tiledImage;
    var count = myViewer.world.getItemCount();
    for (i = 0; i < count; i++) {
      tiledImage = myViewer.world.getItemAt(i);
      tiledImage.setPosition(new OpenSeadragon.Point(0, 0));
    }
    collectionMode=false;
    } else {
      var options = { immediately:true,
                  layout:'horizontal',
                  rows:1 };
      myViewer.world.arrange(options);
      collectionMode=true;
  }
  myViewer.viewport.goHome(true);
}

/* 0 , 1 */
function toggleItem(itemID, itemLabel) {
  var item=myViewer.world.getItemAt(itemID);
  var op=item.getOpacity();
  if (op > 0) {
    _updateOpacity(itemID, 0);
    } else {
      var cnt=myViewer.world.getItemCount();
      var p;
      switch(itemID) {
        case 0:
             p=1;
        break;
        case 1:
            p=0.7;
        break;
        case 2:
            p=0.5;
        break;
        default:
            p=0.8;
      } 
      _updateOpacity(itemID, p);
  }

}

//http://tiku.io/questions/1014477/javascript-convert-grayscale-to-color-given-hue
function _hsv2rgb(h, s, v) {
    h /= 60;
    var i = Math.floor(h);
    var f = h - i;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    var rgb;

    switch (i) {
        case 0:
            rgb = [v, k, m];
            break;
        case 1:
            rgb = [n, v, m];
            break;
        case 2:
            rgb = [m, v, k];
            break;
        case 3:
            rgb = [m, n, v];
            break;
        case 4:
            rgb = [k, m, v];
            break;
        case 5:
        case 6:
            rgb = [v, m, n];
            break;
    }

    return {
        r: rgb[0] * 255 | 0,
        g: rgb[1] * 255 | 0,
        b: rgb[2] * 255 | 0
    }
}

function _hsl2rgb(h, s, l) {
    var r, g, b, q, p;
    
    h /= 360;
    
    if (s == 0) {
        r = g = b = l;
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t++;
            if (t > 1) t--;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        
        q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: r * 255,
        g: g * 255,
        b: b * 255};
}


function pointIt(target) {
  if(myViewer === null) {
     alertify.error("viewer is not setup yet..");
     return;
  }
  if(target === null) {
     alertify.error("target is not valid..");
     return;
  }
  var viewportPoint = myViewer.viewport.pointFromPixel( target.position);
  var imagePoint = myViewer.viewport.viewportToImageCoordinates(
                   viewportPoint.x, viewportPoint.y);
  msg= "click point: ("+imagePoint.x
                    +", "+imagePoint.y+")";
  alertify.success(msg);

}

// will always have _X,_Y,_Z
//    document.location=newTitle;
function updateTitle(_X,_Y,_Z) {
  var newTitle= logHeader+"?";
  for( i=0; i<logURL.length; i++) { 
    url=logURL[i];
    if(i==0) {
      newTitle=newTitle+'url='+url;
      } else {
        newTitle=newTitle+'&url='+url;
    }
  }
  newTitle=newTitle+"&x="+_X+"&y="+_Y+"&z="+_Z;

  var stateObj = { update: newTitle };

  var i=history.length;
  if(i > 0) {
    var e=history.state;
    if (e) {
      var t=e.update;
      if (t) {
        if ( t != newTitle ) {
            history.pushState(stateObj, 'Title', newTitle)
            return 1;
            } else {
               return 0;
        }
        return 0;
      }
    }
  }
  history.pushState(stateObj, 'Title', newTitle)
  return 1;
//  alertify.confirm(newTitle);
}

function snapPosition() {
   savePosition();
   snapX=logX;
   snapY=logY;
   snapZoom=logZoom;
}

function snapGo() {
   if(snapX!=null && snapY!=null && snapZoom!=null)
     goPosition(snapX,snapY,snapZoom);
}

function savePosition() {

  if(myViewer === null) {
     alertify.error("viewer is not setup yet..");
     return;
  }
  var viewportCenter = myViewer.viewport.getCenter('true');
  logX=viewportCenter.x;
  logY=viewportCenter.y;
  logZoom = myViewer.viewport.getZoom(true);
  return updateTitle(logX,logY,logZoom);
}

function checkIt() {
  if(myViewer === null) {
     alertify.error("viewer is not setup yet..");
     return;
  }
  var viewportCenter = myViewer.viewport.getCenter('true');
  var imageCenter = myViewer.viewport.viewportToImageCoordinates(
                    viewportCenter.x, viewportCenter.y);
  msg10= "viewport center: ("+viewportCenter.x
                         +", "+viewportCenter.y+")";
  msg11= "center point: ("+imageCenter.x
                         +", "+imageCenter.y+")";
  msg1= msg10+ "<br/>" +msg11;

  viewportZoom = myViewer.viewport.getZoom(true);
  imageZoom = myViewer.viewport.viewportToImageZoom(viewportZoom);
  msg2= "imageZoom: "+imageZoom + " from viewportZoom:"+viewportZoom;
     
  msg= msg1 + "<br/>" + msg2;
//  alertify.confirm(msg);
}

function goPosition(_X,_Y,_Zoom) {
  var _center=new OpenSeadragon.Point(_X,_Y);
  myViewer.viewport.panTo(_center,'true');
  myViewer.viewport.zoomTo(_Zoom);
  myViewer.viewport.applyConstraints();
}

// should be a very small file
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
     _h=parseInt(_h,10);
     else alertify.error("Error: DZI image must have a height");

  var _w=imageElem[0].getAttribute("WIDTH");
  if(_w != null)
     _w=parseInt(_w,10);
     else alertify.error("Error: DZI image must have a width");

  var _tw=imageElem[0].getAttribute("TILEWIDTH");
  var _th=imageElem[0].getAttribute("TILEHEIGHT");
  if( _tw == null || _th == null) {
     alertify.error("Error: DZI image must have tileWidth & tileHeight");
     } else {
       _tw=parseInt(_tw,10);
       _th=parseInt(_th,10);
  }

  var _scale=imageElem[0].getAttribute("LEVELSCALE");
  if(_scale != null)
     _scale=parseInt(_scale,10);
     else alertify.error("Error: DZI image must have a level Scale");

  var _min=imageElem[0].getAttribute("MINLEVEL");
  if(_min != null)
     _min=parseInt(_min,10);
     else alertify.error("Error: DZI image must have a minimum Level");

  var _max=imageElem[0].getAttribute("MAXLEVEL");
  if(_max != null)
     _max=parseInt(_max,10);
     else alertify.error("Error: DZI image must have a maximum Level");

  var _colortype=imageElem[0].getAttribute("COLORTYPE");
  if(_colortype == null)
     alertify.error("Error: DZI image must have a color type even if unknown");

  var _dir=imageElem[0].getAttribute("DATA");
  if(_dir == null)
     alertify.error("Error: DZI image must have a data directory name");

  if(_h == null || _w == null || _tw == null || _th == null || 
        _scale == null || _min == null || _max == null ||
              _colortype==null ||_dir == null )
     return null; 

  return { 'height':_h,'width':_w, 'tilewidth':_tw,
            'tileheight':_th,'levelscale':_scale,
            'minlevel':_min,'maxlevel':_max,
            'colortype':_colortype,'dir':_dir };
}
