
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
  //                 debugMode: "true",
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

     myViewer.world.addHandler('add-item', function(target) {
// when propertyList matches with total cnt..
       if( propertyList.length == myViewer.world.getItemCount()) {
         showFilters=true;
         _addFilters(); 
       }
     });
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
    var _name=r['channelname'];
    var _alpha=r['channelalpha'];
    var _rgb=r['channelrgb'];
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
    var op=presetOpacity(_alpha,i);
    var hue=presetHue(_rgb,_name);
    var contrast=presetContrast(i);
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
                   opacity: op
                   };
     myViewer.addTiledImage( options );
     addItemListEntry(_name,i,_dir,hue,contrast,op);
     var cname = _name.replace(/ +/g, "");
     propertyList.push( { 'name': _name, 'cname':cname, 'itemID':i, 'opacity':op, 'hue':hue, 'contrast':contrast} );
   }
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

  var _h=imageElem[0].getAttribute("height");
  if(_h != null)
     _h=parseInt(_h,10);
     else alertify.error("Error: DZI image must have a height");

  var _w=imageElem[0].getAttribute("width");
  if(_w != null)
     _w=parseInt(_w,10);
     else alertify.error("Error: DZI image must have a width");

  var _tw=imageElem[0].getAttribute("tileWidth");
  var _th=imageElem[0].getAttribute("tileHeight");
  if( _tw == null || _th == null) {
     alertify.error("Error: DZI image must have tileWidth & tileHeight");
     } else {
       _tw=parseInt(_tw,10);
       _th=parseInt(_th,10);
  }

  var _scale=imageElem[0].getAttribute("levelScale");
  if(_scale != null)
     _scale=parseInt(_scale,10);
     else alertify.error("Error: DZI image must have a level Scale");

  var _min=imageElem[0].getAttribute("minLevel");
  if(_min != null)
     _min=parseInt(_min,10);
     else alertify.error("Error: DZI image must have a minimum Level");

  var _max=imageElem[0].getAttribute("maxLevel");
  if(_max != null)
     _max=parseInt(_max,10);
     else alertify.error("Error: DZI image must have a maximum Level");

  var _channelname=imageElem[0].getAttribute("channelName");
  if(_channelname == null)
     alertify.error("Error: DZI image must have a channel name even if unknown");
// optional
  var _channelalpha=imageElem[0].getAttribute("channelDefaultAlpha");
  if(_channelalpha != null)
     _channelalpha=parseFloat(_channelalpha,10);
  var _channelrgb=imageElem[0].getAttribute("channelDefaultRGB");

  var _dir=imageElem[0].getAttribute("data");
  if(_dir == null)
     alertify.error("Error: DZI image must have a data directory name");

  if(_h == null || _w == null || _tw == null || _th == null ||
        _scale == null || _min == null || _max == null ||
              _channelname==null ||_dir == null )
     return null;

  return { 'height':_h,'width':_w, 'tilewidth':_tw,
            'tileheight':_th,'levelscale':_scale,
            'minlevel':_min,'maxlevel':_max,
            'channelname':_channelname, 'channelalpha':_channelalpha,
            'channelrgb':_channelrgb,'dir':_dir };
}
