
/* run :

  http://localhost/tiletiff/mview.html?
         http://localhost/tiletiff/data/someImage.jpg&
         channelName='combo'&
         meterScaleInPixels=378417.96875
       or
  http://localhost/tiletiff/mview.html?
         url=http://localhost/tiletiff/data/someImage.jpg&
         channelName='combo'&
         aliasName='redData'&
         url=http://localhost/tiletiff/data/anotherImage.jpg&
         channelName='DAPI'&
         aliasName='otherData'&
         meterScaleInPixels=378417.96875

common colors,
var redColors = ['Rhodamine', 'RFP', 'Alexa Fluor 555', 'Alexa Fluor 594',
                  'tdTomato', 'Alexa Fluor 633', 'Alexa Fluor 647']
var greenColors = ['FITC', 'Alexa 488', 'EGFP', 'Alexa Fluor 488']
var blueColors = ['DAPI']
colorized : 'combo' or "TL Brightfield"
*/

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
var logCHANNELNAME=[];
var logALIASNAME=[];

var saveAnnoDiv=null;
var saveHistoryTitle=null;

// this is to work around that the initial load of the viewport
// always goes to the initial view first
var startState=false;

// to track if this is the first state change
var isFirst=true;
// to track special annotation
var isSpecialAnnotation=false;
// to track arrow annotation
var isMarkerAnnotation=false;
// to track hidden annotation
var isHiddenAnnotation=false;
var saveMarkerColor="red";

var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
var isChrome = !!window.chrome && !!window.chrome.webstore;
var isIE = /*@cc_on!@*/false || !!document.documentMode;

var save_meterscaleinpixels;
function saveScalebar(s) { save_meterscaleinpixels=s; }

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
            } else if(kvp[0].trim() == 'channelName') {
              var str=kvp[1].trim(); // trim the ' or "
              if( (str[0] == "\"" && str[ str.length-1 ] == "\"")
                || (str[0] == "\'" && str[ str.length-1 ] == "\'"))
                 str=str.substr(1,str.length-2);
              logCHANNELNAME.push(str);
            } else if(kvp[0].trim() == 'aliasName') {
              var str=kvp[1].trim(); // trim the ' or "
              if( (str[0] == "\"" && str[ str.length-1 ] == "\"")
                || (str[0] == "\'" && str[ str.length-1 ] == "\'"))
                 str=str.substr(1,str.length-2);
              logALIASNAME.push(str);
            } else if(kvp[0].trim() == 'meterScaleInPixels') {
              var m=parseFloat(kvp[1]);
              saveScalebar(m);
            } else if(kvp[0].trim() == 'x') {
                var t=parseFloat(kvp[1]);
                if(!isNaN(t)) {
                  logX=t;
                }
            } else if(kvp[0].trim() == 'y') {
                var t=parseFloat(kvp[1]);
                if(!isNaN(t)) {
                  logY=t;
                }
            } else if(kvp[0].trim() == 'z') {
                var t=parseFloat(kvp[1]);
                if(!isNaN(t)) {
                  logZoom=t;
                }
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

// this is not being run under chaise but just plain vanilla iframe
//    if(enableEmbedded || typeof(RUN_FOR_DEBUG) !== "undefined") {  
    if(typeof(RUN_FOR_DEBUG) !== "undefined") {  
      myViewer = OpenSeadragon({
                   id: "openseadragon",
                   prefixUrl: "images/",
//                   debugMode: true,
                   showNavigator: true,
                   showZoomControl: false,
                   showHomeControl: false,
                   showFullPageControl: false,
                   constrainDuringPan: true,
//                   visibilityRatio:     1,

             });
      } else {
      myViewer = OpenSeadragon({
                   id: "openseadragon",
                   prefixUrl: "images/",
//                   debugMode: true,
                   showNavigator: false,
                   showZoomControl: false,
                   showHomeControl: false,
                   showFullPageControl: true,
                   navigationControlAnchor: OpenSeadragon.ControlAnchor.BOTTOM_RIGHT,
                   constrainDuringPan: true,
//buildPyramid: false,
                   visibilityRatio:     0.5,

             });
      myViewer.controls.bottomright.style.right = '50px';
    }

    myViewer.scalebar({
//            type: OpenSeadragon.ScalebarType.MICROSCOPY,
            type: OpenSeadragon.ScalebarType.MAP,
            pixelsPerMeter: 0,
            minWidth: "75px",
            location: OpenSeadragon.ScalebarLocation.TOP_LEFT,
            xOffset: 5,
            yOffset: 10,
            stayInsideImage: true,
            color: "rgb(153, 0, 0)",
            fontColor: "rgb(0, 0, 0)",
            backgroundColor: "rgba(204, 204, 204, 0.7)",
            fontSize: "small",
            barThickness: 3
    });

    if (typeof annoSetup === "function") {
        // anno is declared in annotorious's jar
        annoSetup(anno,myViewer);
/*
Currently supported property values are:
  
    outline: outline color for annotation and selection shapes
    stroke: stroke color for annotation and selection shapes
    fill: fill color for annotation and selection shapes
    hi_stroke: stroke color for highlighted annotation shapes
    hi_fill fill color for highlighted annotation shapes
    outline_width: outline width for annotation and selection shapes
    stroke_width: stroke width for annotation and selection shapes
    hi_outline_width: outline width for highlighted annotation shapes
    hi_stroke_width: stroke width for highlighted annotation shapes
*/
//  anno.setProperties({ 'outline' : 'purple' }); 

// for annotorious polygon selector
//  anno.addPlugin('PolygonSelector', { activate: true });

    }
    var _alen=logALIASNAME.length; 
    var _ulen=logURL.length;
    for( i=0; i<_ulen; i++) {
       var url=logURL[i];
       var alias=null;
       if(_alen==_ulen) 
         alias=logALIASNAME[i];
       _addURLLayer(url,i,logCHANNELNAME[i],alias);
    }
    // setup the filtering's tracking
    setupFiltering();

    // if logX, logY, logZoom are not null
    if( (logX != null) && (logY != null) && (logZoom !=null)) {
      startState=true;
    }

    // add handlers
    myViewer.addHandler('open', function(target) {
      if(startState) {
        goPosition(logX,logY,logZoom);
        startSate=false;
    // setup the filtering's tracking
      }
    });

    myViewer.addHandler('visible', function(target) {
window.console.log('XXXYYY in visiblehandler.. ');
    });

    myViewer.addHandler('animation-finish', function(target) {
      savePosition();
//  need to reprocess for the size of the visible marker..
      annoResizeMarkers();
    });

/*
    myViewer.addHandler('canvas-enter', function(target) {
      if (typeof annoBtnFadeIn === "function") {
        annoBtnFadeIn();
      }
    });
      if (typeof annoBtnFadeOut === "function") {
        annoBtnFadeOut();
      }
    });
*/
/* -- this is to test access to pixels on the viewport location 
    myViewer.addHandler('canvas-click', function(target) {
window.console.log('canvas got clicked..');
      pointIt(target);
    });
*/

    // only overlays that are being added are annotations
    myViewer.addHandler('add-overlay', function(target) {
       var anno_div=target.element;
       var location=target.location;
       saveAnnoDiv=anno_div; // to be consumed from the osd_annotorious.js
       anno_div.id=makeAnnoIDWithLocation(location);
       anno_div.classList.add("annotation-overlay-outer"); // boxmarker-outer
       var inner_node = anno_div.childNodes[0];
       inner_node.classList.add("annotation-overlay-inner"); // boxmarker-inner
       var marker_node = document.createElement('span-inner');
//       var marker_node = document.createElement('a');
       marker_node.classList.add("annotation-marker"); 
       marker_node.id=makeMarkerIDWithLocation(location);   
       anno_div.appendChild(marker_node);

/*
       var tooltip_node = document.createElement('a');
       tooltip_node.classList.add("annotation-marker-tooltip"); 
       tooltip_node.innerText="1";
       marker_node.appendChild(tooltip_node);
*/
    });

    $('#downloadAction').on('click', function(target) {
      window.console.log("downloadAction activated..");
    });

    $('#printAction').on('click', function(target) {
      window.console.log("printAction activated..");
    });

    myViewer.world.addHandler('add-item', function openHandler() {
// when propertyList matches with total cnt..
       if( propertyList.length == myViewer.world.getItemCount()) {
         resetScalebar(save_meterscaleinpixels);
         showFilters=true;
         _addFilters();
       }
     });

    }
    // Okay, can open shop
    if (typeof annoReady === "function") {
        annoReady();
    }

// http://stackoverflow.com/questions/203198/event-binding-on-dynamically-created-elements

/*
    $(document).on('mouseenter', '.annotation-marker',
      function() 
      {
window.console.log("EXTRA, found a annotation-marker...");
      }
    );
*/

});

function layerId4URL(url) {
  for(var i=0; i<logURL.length; i++) {
    if(url == logURL[i]) {
      return i;
    }
  }
  return null;
}

/****
<?xml version="1.0" encoding="UTF-8"?>
<IMAGE_PROPERTIES
    meterScaleInPixels="378417.96875"
    numTiles="1"
    numImages="1"
    version="2.0"
    tileWidth="1024"
    tileHeight="1024"
    levelScale="2"
    minLevel="0"
    maxLevel="1"
    channelName="combo"
    minValue="0.0"
    maxValue="1.0"
    data=""
/>
****/
function _addURLLayer(url, i, channelname, aliasname) {

    var r= {
           channelname:channelname,
           alpha:null,
           rgb:null,
           dir:"",
           tilewidth:1024,
           tileheight:1024 };

    var _name=channelname;
    var _alpha=null;
    var _rgb=null;
    var _dir=".";

    var op=presetOpacity(_alpha,i);
    var hue=presetHue(_rgb,_name);
    var contrast=presetContrast(i);
    var brightness=presetBrightness(i);
    var options = {
                  tileSource: {
                    type:'image',
                    url:url
                   },
                   compositeOperation: 'lighter',
                  };
    myViewer.addTiledImage( options );

    addItemListEntry(_name,i,_dir,hue,contrast,brightness,op,aliasname);
    var cname = _name.replace(/ +/g, "");
    var p= { 'name': _name, 'cname':cname, 'itemID':i, 'opacity':op, 'hue':hue, 'contrast':contrast, 'brightness':brightness, 'normalize': [0,1] }; 
    if(aliasname != null) {
      p['name']= aliasname;
    }
    var pp=JSON.stringify(p);
window.console.log("new property list is..",pp);
    propertyList.push(p);
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
  var pixel= myViewer.viewport.pixelFromPoint(
new OpenSeadragon.Point(viewportPoint.x,viewportPoint.y));
//  alertify.success(msg);
window.console.log("target position is x ", target.position.x);
window.console.log("target position is y ", target.position.y);
window.console.log(" viewport point is x ", viewportPoint.x);
window.console.log(" viewport point is y ", viewportPoint.y);
window.console.log("   image point is x ", imagePoint.x);
window.console.log("   image point is y ", imagePoint.y);
window.console.log("     pixel point is x ", pixel.x);
window.console.log("     pixel point is y ", pixel.y);

}

function updateHistory(state,newTitle) {
  saveHistoryTitle=newTitle;
  if(!isSafari) {
    /* hum.. https://forums.developer.apple.com/thread/36650 */
    } else {
      history.replaceState(state, 'Title', newTitle)
  }
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

  var h=history;
  var i=history.length;
  var e=null;
  var t=null;
  if(i > 0) {
    var e=history.state;
    if (e) {
      var t=e.update;
      if (t) {
        if ( t != newTitle ) {
            if( isFirst ) {
               isFirst=false;
               updateHistory({},newTitle);
               } else {
                   updateHistory(stateObj,newTitle);
            }
            return 1;
            } else {
               return 0;
        }
        return 0;
      }
    }
  }
  if( isFirst ) {
    isFirst = false;
    updateHistory(stateObj,newTitle);
  }
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

function chkPosition() {
  if(myViewer === null) {
     alertify.error("viewer is not setup yet..");
     return;
  }
  var viewportCenter = myViewer.viewport.getCenter('true');
  var tmpX=viewportCenter.x;
  var tmpY=viewportCenter.y;
  var tmpZoom = myViewer.viewport.getZoom(true);
}

function checkIt() {
  if(myViewer === null) {
     alertify.error("viewer is not setup yet..");
     return;
  }

  var tImage0=null;
  if( myViewer.world.getItemCount() > 1) {
    tImage0=myViewer.world.getItemAt(0);
  }
  var viewportCenter = myViewer.viewport.getCenter('true');
  var imageCenter;
/* need to grab an image and get the center of it.. */
  if( tImage0 ) {
    imageCenter = tImage0.viewportToImageCoordinates(
                         viewportCenter.x, viewportCenter.y);
    } else {
      imageCenter = myViewer.viewport.viewportToImageCoordinates(
                            viewportCenter.x, viewportCenter.y);
  }
  msg10= "viewport center: ("+viewportCenter.x
                         +", "+viewportCenter.y+")";
  msg11= "center point: ("+imageCenter.x
                         +", "+imageCenter.y+")";
  msg1= msg10+ "<br/>" +msg11;
  window.console.log(msg10);
  window.console.log(msg11);

  viewportZoom = myViewer.viewport.getZoom(true);
  if( tImage0 ) {
    imageZoom = tImage0.viewportToImageZoom(viewportZoom);
    } else {
      imageZoom = myViewer.viewport.viewportToImageZoom(viewportZoom);
  }
  msg2= "imageZoom: "+imageZoom + " from viewportZoom:"+viewportZoom;
  msg= msg1 + "<br/>" + msg2;
  window.console.log(msg2);

//  alertify.confirm(msg);
}

function goPosition(_X,_Y,_Zoom) {
  var _center=new OpenSeadragon.Point(_X,_Y);
  myViewer.viewport.panTo(_center,'true');
  if(_Zoom === null) {
    myViewer.viewport.zoomTo(logZoom);
    } else {
      myViewer.viewport.zoomTo(_Zoom);
  }
  myViewer.viewport.applyConstraints();
}

function goPositionByBounds(_X,_Y,_width,_height) {
  var rect  = new OpenSeadragon.Rect(_X, _Y, _width, _height);
  myViewer.viewport.fitBounds(rect,true);
  myViewer.viewport.applyConstraints();
}

// should be a very small html file
function ckExist(url) {
  var http = new XMLHttpRequest();
  http.onload = function () {
    window.console.log(http.responseText);
  }
  http.open("GET", url, false);
  http.send(null);
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

  var _overlap=imageElem[0].getAttribute("overlap");
  if(_overlap != null)
     _overlap=parseInt(_overlap,10);
     else _overlap=0;

  var _format=imageElem[0].getAttribute("format");
  if(_format == null)
     _format="jpg"; // default

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

  var _msip=imageElem[0].getAttribute("meterScaleInPixels");
  if(_msip != null)
     _msip=parseFloat(_msip);
     else _msip=0;

  var _minv=imageElem[0].getAttribute("minValue");
  if(_minv != null)
     _minv=parseFloat(_minv);
     else _minv=0.0;

  var _maxv=imageElem[0].getAttribute("maxValue");
  if(_maxv != null)
     _maxv=parseFloat(_maxv);
     else _maxv=1.0;


  if(_h == null || _w == null || _tw == null || _th == null ||
        _scale == null || _min == null || _max == null ||
              _channelname==null ||_dir == null )
     return null;

  return { 'height':_h,'width':_w, 'tilewidth':_tw,
            'tileheight':_th,'levelscale':_scale,
            'minlevel':_min,'maxlevel':_max, 'overlap':_overlap,
            'channelname':_channelname, 'channelalpha':_channelalpha,
            'channelrgb':_channelrgb,'dir':_dir, 'format':_format,
            'meterscaleinpixels':_msip, 'minvalue':_minv, 'maxvalue':_maxv};
}


function jpgClick(fname) {
   var dname=fname;
   if(dname == null) {
     var f = new Date().getTime();
     var ff= f.toString();
     dname="osd_"+ff+".jpg";
   }

   var rawImg;
   if( hasScalebar() ) {
      var canvas=myViewer.scalebarInstance.getImageWithScalebarAsCanvas();
      rawImg = canvas.toDataURL("image/jpeg",1);
      } else {
        rawImg = myViewer.drawer.canvas.toDataURL("image/jpeg",1);
   }

   if( ! isIE ) { // this only works for firefox and chrome
     var dload = document.createElement('a');
     dload.href = rawImg;
     dload.download = dname;
     dload.innerHTML = "Download Image File";
     dload.style.display = 'none';
     if( isChrome ) {
       dload.click();
       delete dload;
       } else {
         dload.onclick=destroyClickedElement;
         document.body.appendChild(dload);
         dload.click();
         delete dload;
     }
     } else {
       if(isSafari) {
         rawImg= rawImg.replace("image/jpeg", "image/octet-stream");
         document.location.href = rawImg;
         } else { // IE
            var blob = dataUriToBlob(rawImg);
            window.navigator.msSaveBlob(blob, dname);
       }
   }
}

function jpgAllClick(fname) {
   var dname=fname;
   if(dname == null) {
     var f = new Date().getTime();
     var ff= f.toString();
     dname="osd_"+ff+".jpg";
   }

   var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
   var isChrome = !!window.chrome && !!window.chrome.webstore;
   var isIE = /*@cc_on!@*/false || !!document.documentMode;

   if(!enableEmbedded) { // only when it is a standalone viewer
      $('.annotorious-popup').css('display','none');
   }
//http://stackoverflow.com/questions/10932670/how-do-i-draw-the-content-of-div-on-html5-canvas-using-jquery
   html2canvas(document.body, {
       onrendered: function(canvas) {
       var rawImg = canvas.toDataURL("image/jpeg",1);
//       window.open(img);

       if( ! isIE ) { // this only works for firefox and chrome
         var dload = document.createElement('a');
         dload.href = rawImg;
         dload.download = dname;
         dload.innerHTML = "Download Image File";
         dload.style.display = 'none';
         if( isChrome ) {
           dload.click();
           delete dload;
           } else {
             dload.onclick=destroyClickedElement;
             document.body.appendChild(dload);
             dload.click();
             delete dload;
         }
         } else {
           if(isSafari) {
             rawImg= rawImg.replace("image/jpeg", "image/octet-stream");
             document.location.href = rawImg;
             } else { // IE
                var blob = dataUriToBlob(rawImg);
                window.navigator.msSaveBlob(blob, dname);
           }
       }
       }
   });
   if(!enableEmbedded) { // only when it is a standalone viewer
     $('.annotorious-popup').css('display','');
   }
}


//http://www.quirksmode.org/js/detect.html
//http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/9851769
function jpgClickNoScale(fname) {
   var dname=fname;
   if(fname == null) {
     var f = new Date().getTime();
     var ff= f.toString();
     dname="osd_"+ff+".jpg";
   }
   var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
   var isChrome = !!window.chrome && !!window.chrome.webstore;
   var isIE = /*@cc_on!@*/false || !!document.documentMode;

   if( ! isSafari && ! isIE ) { // this only works for firefox and chrome
     var img = myViewer.drawer.canvas.toDataURL("image/jpeg",1);
     var dload = document.createElement('a');
     dload.href = img;
     dload.download = dname;
     dload.innerHTML = "Download Image File";
     dload.style.display = 'none';
     if( isChrome ) {
       dload.onclick=destroyClickedElement;
       dload.click();
       delete dload;
       } else {
         document.body.appendChild(dload);
         dload.click();
         delete dload;
     }
     } else {
       if(isSafari) {
         var rawImg = myViewer.drawer.canvas.toDataURL("image/jpeg",1);
         rawImg= rawImg.replace("image/jpeg", "image/octet-stream");
         document.location.href = rawImg;
         } else { // IE
            var rawImg = myViewer.drawer.canvas.toDataURL("image/jpeg",1);
            var blob = dataUriToBlob(rawImg);
            window.navigator.msSaveBlob(blob, dname);
       }
   }
}

function dataUriToBlob(dataURI) {
  // serialize the base64/URLEncoded data
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
    } else {
      byteString = unescape(dataURI.split(',')[1]);
  }

  // parse the mime type
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // construct a Blob of the image data
  var array = [];
  for(var i = 0; i < byteString.length; i++) {
    array.push(byteString.charCodeAt(i));
  }
  return new Blob(
    [new Uint8Array(array)],
    {type: mimeString}
  );
}


function zoomInClick() {
  var c=myViewer.zoomPerClick / 1.0;
  myViewer.viewport.zoomBy(c);
  myViewer.viewport.applyConstraints();
}

function zoomOutClick() {
  var c=1/myViewer.zoomPerClick;
  myViewer.viewport.zoomBy(c);
  myViewer.viewport.applyConstraints();
}

function homeClick() {
  myViewer.viewport.goHome();
  myViewer.viewport.applyConstraints();
}

function fullPageClick() {
    if ( myViewer.isFullPage() && !$.isFullScreen() ) {
        // Is fullPage but not fullScreen
        myViewer.setFullPage( false );
    } else {
        myViewer.setFullScreen( !myViewer.isFullPage() );
    }
    // correct for no mouseout event on change
    if ( myViewer.buttons ) {
        myViewer.buttons.emulateExit();
    }
    if(myViewer.fullPageButton === undefined) {
window.console.log("BAD BAD BAD...");
       return;
    }
    myViewer.fullPageButton.element.focus();
    if ( myViewer.viewport ) {
        myViewer.viewport.applyConstraints();
    }
}

function markMarker() { isMarkerAnnotation=true; }
function unmarkMarker() { isMarkerAnnotation=false; }
function markSpecial() { isSpecialAnnotation=true; }
function unmarkSpecial() { isSpecialAnnotation=false; }
function markHidden() { isHiddenAnnotation=true; }
function unmarkHidden() { isHiddenAnnotation=false; }

// reuse the calls to be like annotorious_ui's
function specialClick() {
   var stog = document.getElementById('special-toggle');
   if(isSpecialAnnotation) {
      unmarkSpecial();
      stog.style.color='black';
      } else {
        markSpecial();
        stog.style.color='green';
   }
}

function markerClick() {
   var atog = document.getElementById('marker-toggle');
   if(isMarkerAnnotation) {
      unmarkMarker();
      atog.style.color='black';
      } else {
        markMarker();
        var clist= [ 'red', 'green', 'blue', 'yellow'];
        var i=Math.floor((Math.random() * 3) + 1);
        saveMarkerColor=clist[i-1];
        atog.style.color=saveMarkerColor;
   }
}

// reuse the calls to be like annotorious_ui's
function hiddenClick() {
   var htog = document.getElementById('hidden-toggle');
   if(isHiddenAnnotation) {
      unmarkHidden();
      htog.style.color='black';
      } else {
        markHidden();
        htog.style.color='yellow';
   }
}

var toggle=true;
// dump some info
function testClick() {
  var vCenter = myViewer.viewport.getCenter(true);
  var tmpX=vCenter.x;
  var tmpY=vCenter.y;
  var tmpZ = myViewer.viewport.getZoom(true);
  window.console.log("testClick, viewport center:("+tmpX+", "+tmpY+") Z"+tmpZ);
  var vBounds=myViewer.viewport.getBounds(true);
  window.console.log("           bounds:"+vBounds.toString());

  annoChk();
  if(toggle) {
    annoHideAllAnnotations();
    } else {
    annoShowAllAnnotations();
  }
  toggle=!toggle;
}

function resetScalebar(value)
{
  var options = {};
  options['pixelsPerMeter'] = value;
  myViewer.scalebar(options);
}

function hasScalebar()
{
  var _pixelsPerMeter=myViewer.scalebarInstance.pixelsPerMeter;
  if(_pixelsPerMeter != 0) {
    return true;
    } else {
      return false;
  }
}
