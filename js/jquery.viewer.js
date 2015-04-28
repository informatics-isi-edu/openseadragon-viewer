
/* run : 

  http://localhost/tiletiff/sea.html?
         url=http://localhost/tiletiff/data/tall.dzi
or
  http://localhost/tiletiff/sea.html?
         http://localhost/tiletiff/data/sample3_DZI/ImageProperties.xml
*/

jQuery(document).ready(function() {

//process args
  var args = document.location.search.substring(1).split('&');
  argsParsed = [];
  for (var i=0; i < args.length; i++)
  {
      arg = unescape(args[i]);

      if (arg.length == 0) {
        continue;
      }

      if (arg.indexOf('=') == -1)
      {
          var _url=arg.replace(new RegExp('/$'),'').trim();
          argsParsed.push(_url);
      }
      else
      {
          kvp = arg.split('=');
          if(kvp[0].trim() == 'url') {
              var _url=kvp[1].replace(new RegExp('/$'),'').trim();
              argsParsed.push(_url);
          } else {
              var _unknown=kvp[1].replace(new RegExp('/$'),'').trim();
              var _utype=kvp[0].trim();
              alertify.error("Error: Unable to handle param type, "+_utype);
          }
      }
  }
  if(argsParsed.length != 1) {
    alertify.error("Error: Need to supply an url");
  } else {
    var url=argsParsed[0];
    var e = ckExist(url);
/* make sure it exists */
    var e = ckExist(url);
    if(e==null) {
      alertify.error("Error: Unable to load url, "+url);
      } else {
        if( e.match(/deepzoom/)) { // not ours, call direct
          var viewer = OpenSeadragon({
                   id: "viewDiv",
                   prefixUrl: "images/",
//                   debugMode: "true",
                   showNavigator: true,
//                   navigatorId: "navigatorDiv",
                   tileSources: url
                   });
          } else {
            var r = extractInfo(e); 
            if( r != null) {
              var _height=r[0];
              var _width=r[1];
              var _tileSize=r[2];
              var _minLevel=r[3];
              var _maxLevel=r[4];
              var _dir=r[5];
              var _realMin=_minLevel;
//this is needed because there is no level 0
              if(_minLevel != 0)
                  _realMin = _minLevel+1;
              
//window.console.log("min is "+_minLevel + " max is "+_maxLevel, "_realMin "+_realMin); 
              path = url.replace('ImageProperties.xml',_dir);
              var viewer = OpenSeadragon({
                         id: "viewDiv",
                         prefixUrl: "images/",
//                       debugMode: "true",
                         showNavigator: "true",
constrainDuringPan: true,
defaultZoomLevel: _realMin,
visibilityRatio: 	1,
//                         navigatorId: "navigatorDiv",
                         tileSources: {
                           height: _height,
                           width:  _width,
                           tileSize: _tileSize,
                           minLevel: _minLevel,
                           maxLevel: _maxLevel,
                           getTileUrl: function( level, x, y ) {
                             t=path+'/'+(level)+"/"+x+"_"+y+".jpg";
                             window.console.log("tile is.."+t);
                             return t;
                           }
                         }
                        })
            }
        }
    }
  }

});

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

  var _t=imageElem[0].getAttribute("TILESIZE");
  if(_t != null)
     _t=parseInt(_t,10);
     else alertify.error("Error: DZI image must have a tilesize");

  var _min=imageElem[0].getAttribute("MINLEVEL");
  if(_min != null)
     _min=parseInt(_min,10);
     else alertify.error("Error: DZI image must have a minimum Level");

  var _max=imageElem[0].getAttribute("MAXLEVEL");
  if(_max != null)
     _max=parseInt(_max,10);
     else alertify.error("Error: DZI image must have a maximum Level");

  var _dir=imageElem[0].getAttribute("DATA");
  if(_dir == null)
     alertify.error("Error: DZI image must have a data directory name");

  if(_h == null || _w == null || _t == null || 
        _min == null || _max == null || _dir == null )
     return null; 

  return [_h,_w,_t,_min,_max,_dir];
}
