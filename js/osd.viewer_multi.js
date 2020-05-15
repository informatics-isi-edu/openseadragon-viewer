s/* run :

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
      url=http://localhost/data/cirm/real3/DZI/ImageProperties.xml&
      url=http://localhost/data/cirm/real3/DZC/DAPI/ImageProperties.xml&
      url=http://localhost/data/cirm/real3/DZC/Alexa Fluor 488/ImageProperties.xml&
      url=http://localhost/data/cirm/real3/DZC/Alexa Fluor 555/ImageProperties.xml

to bring in another annotator's data xml, (specific to a particular one..)

  http://localhost/tiletiff/mview.html?
      url=http://localhost/data/otherAnnotator/DZI/Brigh/ImageProperties.xml&
      url=http://localhost/data/otherAnnotator/AnnotationData.xml

to handle none-dzi images

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

const DEFAULT_FONT_SIZE=20;
var isCantaloupe = false;
var cantaloupe_meterscaleinpixels = 0;

var myViewer=null;

// A flag to track whether OpenSeadragon/Annotorious is
// being used inside another window (i.e. Chaise), set enableEmbedded.

var enableEmbedded = false;
if (window.self !== window.top) {
    enableEmbedded = true;
}

/*** this does not seem to work..
if (window.self !== window.top) {
  var $iframe_parent_div = window.frameElement ? $(window.frameElement.parentNode) : null;
  if (!$iframe_parent_div || !$iframe_parent_div.is(':visible'))
    enableEmbedded = true;
}
****/


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

var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
//var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
var isChrome = !!window.chrome && !!window.chrome.webstore;
var isIE = /*@cc_on!@*/false || !!document.documentMode;

// gudmap.org or rebuildingakidney.org
var waterMark=null; // for downloaded image
function saveWaterMark(s) { waterMark=s; }
function addWaterMark2Canvas(canvas) {
  var fsize=DEFAULT_FONT_SIZE;
  var h=canvas.height;
  var w=canvas.width;
  var l=Math.floor(w/20);
  var ctx = canvas.getContext("2d");
  if(l<fsize) // cap it at 20
    fsize=l;

   ctx.save();

  // from the scalebarInstance get the coordinates for the BOTTOM_LEFT
  var myScalebarInstance = myViewer.scalebarInstance;
  var barHeight = myScalebarInstance.divElt.offsetHeight;
  var container = myScalebarInstance.viewer.container;
  var x = 0;
  var y = container.offsetHeight - barHeight;
  var pixel = myScalebarInstance.viewer.viewport.pixelFromPoint(
          new OpenSeadragon.Point(0, 1 / myScalebarInstance.viewer.source.aspectRatio),
          true);
  if (!myScalebarInstance.viewer.wrapHorizontal) {
      x = Math.max(x, pixel.x);
  }
  if (!myScalebarInstance.viewer.wrapVertical) {
      y = Math.min(y, pixel.y - barHeight);
  }

  // for the retina case get the pixel density ratio
  // for non retina, this value is 1
  var pixelDensityRatio=queryForRetina(canvas);
  x = x*pixelDensityRatio;
  y = y*pixelDensityRatio;
  x = x + myScalebarInstance.xOffset;
  y = y - myScalebarInstance.yOffset;

  // fill a black rectangle as a background for the watermark
  ctx.font = fsize+"pt Sans-serif";
  var rectWidth = Math.ceil(ctx.measureText(waterMark).width);
  ctx.fillStyle = 'rgb(208, 224, 240)';
  ctx.fillRect(x, y-myScalebarInstance.yOffset, rectWidth, fsize+myScalebarInstance.yOffset);

  // fill the watermark in the rectangle
  ctx.textAlign = "left";
  ctx.fillStyle = "rgb(51, 51, 51)";
  ctx.fillText(waterMark,x,y+myScalebarInstance.yOffset);

  ctx.restore();
  window.console.log('Added watermark: ' + waterMark);
}

var save_meterscaleinpixels;
function saveScalebar(s) { save_meterscaleinpixels=s; }

// false, if any of url is of ImageProperties.xml or "/iiif/"
// need to process all the url for 'alias'
function isSimpleBaseImage() {
  for(var i=0; i<logURL.length; i++) {
     var url=logURL[i];
     if(url.indexOf('ImageProperties.xml')!= -1 || url.startsWith('/iiif/'))
       return false;
  }
  return true;
}

// true, if any of the url starts with "/iiif/"
// this for images that will be handled by cantaloupe
function isIIIFImage() {
for(var i=0; i<logURL.length; i++) {
  var url=logURL[i];
  if(url.startsWith('/iiif/'))
    return true;
}
return false;
}

// ...MAIN...
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
	  	param = params[i];
	  	// cantaloupe parameters should not be escaped
	  	if (param.indexOf('/iiif/') == -1) {
	        param = unescape(params[i]);
	  	}

        if (param.indexOf('=') == -1)
        {
          url=param.replace(new RegExp('/$'),'').trim();
          logURL.push(url);
          logCHANNELNAME.push(null);
          logALIASNAME.push(null);
        } else {
            kvp = param.split('=');
            if(kvp[0].trim() == 'url') {
              url=kvp[1].replace(new RegExp('/$'),'').trim();
              if(logURL.length > 0) {
                if(logCHANNELNAME.length < logURL.length)
                  logCHANNELNAME.push(null);
                if(logALIASNAME.length < logURL.length) {
                  var c=logCHANNELNAME.length-1;
                  logALIASNAME.push(logCHANNELNAME[c]);
                }
              }
              if (url.startsWith('/iiif/') && isCantaloupe == false) {
            	  isCantaloupe = true;
              }
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
              if (isCantaloupe == true) {
            	  cantaloupe_meterscaleinpixels = m;
              }
            } else if(kvp[0].trim() == 'waterMark') {
              var str=kvp[1].trim(); // trim the ' or "
              if( (str[0] == "\"" && str[ str.length-1 ] == "\"")
                || (str[0] == "\'" && str[ str.length-1 ] == "\'"))
                 str=str.substr(1,str.length-2);
              saveWaterMark(str);
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
  if (isIIIFImage() && save_meterscaleinpixels == null) {
	  // make sure that for the cantaloupe images w/o scale we set the value 0
	  saveScalebar(0);
  }
// last case where there is no ending url
  if(logCHANNELNAME.length < logURL.length)
    logCHANNELNAME.push(null);
  if(logALIASNAME.length < logURL.length) {
    var c=logCHANNELNAME.length-1;
    logALIASNAME.push(logCHANNELNAME[c]);
  }
  if(logURL.length == null) {
    alertify.error("Error: Need to supply an url");
  } else {

    var isSimpleURL=isSimpleBaseImage();
    var isIIIFURL=isIIIFImage();
    // setup the channel alias names, only for simple url
    var toShowNavigator=true; // suppress navigator if it is simple jpg viewing
    if(isSimpleURL) {
      toShowNavigator=false;
/* ??? not sure how to replace this
      var _alen=logALIASNAME.length;
      var _clen=logCHANNELNAME.length;
      if(_clen > 0 && _alen != _clen) {
        // copy over
        logALIASNAME=[];
        logALIASNAME=logCHANNELNAME;
      }
*/
      var _alen=logALIASNAME.length;
      var _clen=logCHANNELNAME.length;
      for(var cidx=0; cidx < _clen; cidx++) {
         if(logCHANNELNAME[cidx] != null && logALIASNAME[cidx]== null)
           logALIASNAME[cidx]=logCHANNELNAME[cidx];
      }
    }
    if(isIIIFURL) {
    	// we don't show the navigator for the cantaloupe images
    	toShowNavigator=false;
    }
    if(enableEmbedded || typeof(RUN_FOR_DEBUG) !== "undefined") {
    	if (isIIIFURL) {
    		// the cantaloupe images needs some special options:
    		// ajaxWithCredentials: for AJAX requests
    		// maxZoomPixelRatio: for zoom-in (the default is 1.1)
    		// crossOriginPolicy: for canvas requests to use cantaloupe server
    		// tileSources: an array with the scenes URLs
    		if (logURL.length == 1) {
    	  	      myViewer = OpenSeadragon({
    	              id: "openseadragon",
    	              prefixUrl: "images/",
    	              showNavigator: toShowNavigator,
    	              showZoomControl: false,
    	              showHomeControl: false,
    	              showFullPageControl: false,
    	              constrainDuringPan: true,
    	              ajaxWithCredentials : true,
    	              maxZoomPixelRatio: 1,
    	              crossOriginPolicy: "Anonymous",
    	              tileSources: logURL
    	        });
    		} else {
    			// for multi scenes additonal parameters:
    			// collectionMode: arrange your TiledImages in a grid or line
    			// collectionRows: all the scenes will be arranged on a single row

  	  	      myViewer = OpenSeadragon({
	              id: "openseadragon",
	              prefixUrl: "images/",
	              showNavigator: toShowNavigator,
	              showZoomControl: false,
	              showHomeControl: false,
	              showFullPageControl: false,
	              constrainDuringPan: true,
	              ajaxWithCredentials : true,
	              maxZoomPixelRatio: 1,
	              collectionMode: true,
	              collectionRows: 1,
	              crossOriginPolicy: "Anonymous",
	              tileSources: logURL
	        });
    		}
    	} else {
      myViewer = OpenSeadragon({
                   id: "openseadragon",
                   prefixUrl: "images/",
//                   debugMode: true,
                   showNavigator: toShowNavigator,
                   showZoomControl: false,
/*
tileSources: {
   type:'image',
   buildPyramid: false,
   url: logURL[0]
},
compositeOperation: 'lighter',
*/
                   showHomeControl: false,
                   showFullPageControl: false,
                   constrainDuringPan: true,
// FOR gudmap overlay
//                   visibilityRatio:     1,
             });
    	}
     } else {
       myViewer = OpenSeadragon({
                   id: "openseadragon",
                   prefixUrl: "images/",
//                   debugMode: true,
                   showNavigator: toShowNavigator,
                   showZoomControl: true,
                   showHomeControl: true,
                   showFullPageControl: true,
                   navigationControlAnchor: OpenSeadragon.ControlAnchor.TOP_LEFT,
                   constrainDuringPan: true,
//                   visibilityRatio:     1,

             });
       myViewer.controls.topleft.style.left = '160px';
   }

    myViewer.scalebar({
//            type: OpenSeadragon.ScalebarType.MICROSCOPY,
            type: OpenSeadragon.ScalebarType.MAP,
            pixelsPerMeter: 0,
            minWidth: "75px",
            location: OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT,
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

// XXX for poly, anno.addPlugin('PolygonSelector', { activate: true });

    }
    for( i=0; i<logURL.length; i++) {
       url=logURL[i];

       if(url.indexOf('ImageProperties.xml')!= -1) {
          _addURLLayer(url,i);
       } else if(url.indexOf('.svg')!= -1) {
               // accepting annotation data in svg xml
          _addSVGDataLayer(url,i,logCHANNELNAME[i],logALIASNAME[i]);
       } else if(url.indexOf('AnnotationData.xml')!= -1) {
               // accepting other annotator's annotation data in XML
          _addDataLayer(url,i);
       } else if(isIIIFURL) {
           // IIIF image data
    	   // for now, add just the channel in the property list
    	   _addIIIFURLLayer(url,i,logCHANNELNAME[i],logALIASNAME[i]);
       } else if(isSimpleURL) {
               // other image data in simple jpg/png format
          _addSimpleURLLayer(url,i,logCHANNELNAME[i],logALIASNAME[i]);
       } else {
          alertify.error("URL needs to be either ImageProperties.xml, AnnotationData.xml, svg file or  must be simple jpg/png");
       }
    }
    // setup the filtering's tracking
    setupFiltering();

    // if logX, logY, logZoom are not null
    if( (logX != null) && (logY != null) && (logZoom !=null)) {
      startState=true;
    }

    // add handlers
/******
   This is not being called properly in osd anymore and so
   the startState is being set in savePosition
     myViewer.addHandler('open', function(target) {
      if(startState) {
window.console.log("MEI in startState...");
        goPosition(logX,logY,logZoom);
        startState=false;
      }
    });
******/

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
    myViewer.addHandler('canvas-exit', function(target) {
      if (typeof annoBtnFadeOut === "function") {
        annoBtnFadeOut();
      }
    });
*/
/* -- this is to test access to pixels on the viewport location */
    if(typeof(RUN_FOR_DEBUG) !== "undefined") {
      myViewer.addHandler('canvas-click', function(target) {
        window.console.log('canvas got clicked..');
        pointIt(target);
      });
    }

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
       if( propertyList.length == myViewer.world.getItemCount() && !isIIIFURL) {
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

    if(isIIIFURL) {
    	// for cantaloupe image set the scale bar
        resetScalebar(cantaloupe_meterscaleinpixels);
        if (logURL.length > 1) {
            myViewer.scalebar({stayInsideImage: false});
        }
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
    var _overlap=r['overlap'];
    var _dir=r['dir'];
    var _format=r['format'];
    var _meterscaleinpixels=r['meterscaleinpixels'];
    var _minvalue=r['minvalue'];
    var _maxvalue=r['maxvalue'];
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
    var cname = _name.replace(/ +/g, "");
    var op=presetOpacity(_alpha,i);
    var hue=presetHue(_rgb,_name);
    var contrast=presetContrast(i);
    var brightness=presetBrightness(i);
    var gamma=presetGamma(i,_name);
    var options = {
                  tileSource: {
                     height: _height,
                     width:  _width,
                     tileWidth: _tileWidth,
                     tileHeight: _tileHeight,
                     tileOverlap: _overlap,
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
                       t=path+'/'+(level)+"/"+x+"_"+y+"."+_format;
                       return t;
                   }},
                   defaultZoomLevel: _realMin,
                   compositeOperation: 'lighter',
                   opacity: op
                   };
     myViewer.addTiledImage( options );
     addItemListEntry(_name,i,_dir,hue,contrast,brightness,op,gamma);
     propertyList.push( { 'name': _name, 'cname':cname, 'itemID':i, 'opacity':op, 'hue':hue, 'contrast':contrast, 'brightness':brightness, 'gamma':gamma } );
     resetScalebar(_meterscaleinpixels);
   }
}

function _addDataLayer(url, i) {
  var e = ckExist(url);
  if(e==null) {
    alertify.error("Error: Unable to load url, "+url);
    return;
  }
  extractDataXML(e);
}

function _addSVGDataLayer(url, i, channelname, aliasname) {
  var e = ckExist(url);
  if(e==null) {
    alertify.error("Error: Unable to load url, "+url);
    return;
  }
  if(channelname == null && aliasname == null) {
    alertify.error("Error: addSVGDataLayer, missing both channelname and aliasname");
    return;
  }
  var cname=null;
  if(channelname)
    cname=channelname.replace(/ +/g, "");
  if(aliasname)
    cname = aliasname.replace(/ +/g, "");
  extractSVGDataXML(i,cname, e);
}

function _addSimpleURLLayer(url, i, channelname, aliasname) {

    if(channelname == null && aliasname == null) {
      alertify.error("Error: addSVGDataLayer, missing both channelname and aliasname");
      return;
    }
    var cname = null;
    var _name=null;
    if(channelname) {
       _name=channelname;
       cname = _name.replace(/ +/g, "");
    }
    if(aliasname)
       cname = aliasname.replace(/ +/g, "");

    var _alpha=null;
    var _rgb=null;
    var _dir=".";

    var op=presetOpacity(_alpha,i);
    var hue=presetHue(_rgb,_name);
    var contrast=presetContrast(i);
    var brightness=presetBrightness(i);
    var gamma=presetGamma(i,_name);
    var options = {
                  tileSource: {
                     tileWidth: 457,
                     tileHeight: 640,
                    type:'image',
                    url:url
                  },
                  compositeOperation: 'lighter'
                  };
    myViewer.addTiledImage( options );

    addItemListEntry(_name,i,_dir,hue,contrast,brightness,op,gamma,aliasname);
    var p= { 'name': _name, 'cname':cname, 'itemID':i, 'opacity':op, 'hue':hue, 'contrast':contrast, 'brightness':brightness, 'gamma':gamma};
    if(aliasname != null) {
      p['name']= aliasname;
    }
    var pp=JSON.stringify(p);
//window.console.log("new property list is..",pp);
    propertyList.push(p);
}


function _addIIIFURLLayer(url, i, channelname, aliasname) {

    if(channelname == null && aliasname == null) {
      return;
    }
    var cname = null;
    var _name=null;
    if(channelname) {
       _name=channelname;
       cname = _name.replace(/ +/g, "");
    }
    if(aliasname)
       cname = aliasname.replace(/ +/g, "");

    var _alpha=null;
    var _rgb=null;
    var _dir=".";

    var op=presetOpacity(_alpha,i);
    var hue=presetHue(_rgb,_name);
    var contrast=presetContrast(i);
    var brightness=presetBrightness(i);
    var gamma=presetGamma(i,_name);

    addItemListEntry(_name,i,_dir,hue,contrast,brightness,op,gamma,aliasname);
    var p= { 'name': _name, 'cname':cname, 'itemID':i, 'opacity':op, 'hue':hue, 'contrast':contrast, 'brightness':brightness, 'gamma':gamma};
    if(aliasname != null) {
      p['name']= aliasname;
    }
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
    /* hum2.. https://forums.developer.apple.com/message/208015#208015 */
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
  if(startState) {
    goPosition(logX,logY,logZoom);
    startState=false;
    return;
  }
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
//    window.console.log(http.responseText);
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


// XXX Retina scale factor ???
function jpgClick(fname) {
   var dname=fname;
   if(dname == null) {
     var f = new Date().getTime();
     var ff= f.toString();
     dname="osd_"+ff+".jpg";
   }

   var canvas;
   var rawImg;
   if( hasScalebar() ) {
     canvas=myViewer.scalebarInstance.getImageWithScalebarAsCanvas();
     if(waterMark != null) {
       addWaterMark2Canvas(canvas);
     }
     rawImg = canvas.toDataURL("image/jpeg",1);
     } else {
       canvas= myViewer.drawer.canvas;
       var pixelDensityRatio=queryForRetina(canvas);
       if(pixelDensityRatio != 1) {
         var newCanvas = document.createElement("canvas");
         var _width=canvas.width;
         var _height=canvas.height;
         newCanvas.width = _width;
         newCanvas.height = _height;
         var newCtx = newCanvas.getContext("2d");
         newCtx.drawImage(canvas, 0,0, _width, _height,
                                  0,0, _width, _height);
         if(waterMark != null) {
           addWaterMark2Canvas(newCanvas);
         }
         rawImg = newCanvas.toDataURL("image/jpeg",1);
//window.open(rawImg);
         } else {
             var newCanvas = document.createElement("canvas");
             var _width=canvas.width;
             var _height=canvas.height;
             newCanvas.width = _width;
             newCanvas.height = _height;
             var newCtx = newCanvas.getContext("2d");
             newCtx.drawImage(canvas, 0,0, _width, _height,
                                      0,0, _width, _height);
            if(waterMark != null) {
              addWaterMark2Canvas(newCanvas);
            }
            rawImg = newCanvas.toDataURL("image/jpeg",1);
       }
   }

   if( !isIE && !isSafari ) { // this only works for firefox and chrome
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
//https://github.com/eligrey/FileSaver.js/issues/12#issuecomment-47247096
//         rawImg= rawImg.replace("image/jpeg", "image/octet-stream");
//         rawImg= rawImg.replace("image/jpeg", "image/png");
         rawImg= rawImg.replace("image/jpeg", "application/octet-stream");
         document.location.href = rawImg;
         } else { // IE
            var blob = dataUriToBlob(rawImg);
            window.navigator.msSaveBlob(blob, dname);
       }
   }
}

// download everything on the canvas including the annotations..
// var overlay=myViewer.svgOverlay();
function jpgAllClick(fname) {
   var dname=fname;
   if(dname == null) {
     var f = new Date().getTime();
     var ff= f.toString();
     dname="osd_"+ff+".jpg";
   }

   if(!enableEmbedded) { // only when it is a standalone viewer
      $('.annotorious-popup').css('display','none');
   }
//http://stackoverflow.com/questions/10932670/how-do-i-draw-the-content-of-div-on-html5-canvas-using-jquery
   html2canvas(document.body, {
       onrendered: function(canvas) {
// RETINA FIX
       var rawImg;
       var pixelDensityRatio=queryForRetina(canvas);
       if(pixelDensityRatio != 1) {
         var newCanvas = document.createElement("canvas");
         var _width = canvas.width;
         var _height = canvas.height;
         newCanvas.width = _width;
         newCanvas.height = _height;
         var newCtxt = newCanvas.getContext("2d");
         newCtxt.drawImage(canvas, 0,0, _width, _height,
                                  0,0, _width, _height);
/* grab overlays
         var overlay=myViewer.svgOverlay();
*/
         rawImg = newCanvas.toDataURL("image/jpeg",1);
         } else {
           var ctxt = canvas.getContext("2d");
           var overlay=document.getElementsByTagName("svg");
           var cnt=overlay.length;
           for(var i=0; i<cnt; i++) {
//           ctxt.drawImage(overlay[i], 0, 0);
           }
           rawImg = canvas.toDataURL("image/jpeg",1);
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
// make an annotation 'special'
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

var TESTtoggle=true;
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
  if(TESTtoggle) {
    annoHideAllAnnotations();
    } else {
    annoShowAllAnnotations();
  }
  TESTtoggle=!TESTtoggle;

// MEI, add one test..

window.console.log("from testClick..");
  checkIt();
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

// testing for retina
function queryForRetina(canv) {
// query for various pixel ratios
 var ctxt = canv.getContext("2d");
 var devicePixelRatio = window.devicePixelRatio || 1;
 var backingStoreRatio = ctxt.webkitBackingStorePixelRatio ||
                         ctxt.mozBackingStorePixelRatio ||
                         ctxt.msBackingStorePixelRatio ||
                         ctxt.oBackingStorePixelRatio ||
                         ctxt.backingStorePixelRatio || 1;
  var pixelDensityRatio = devicePixelRatio / backingStoreRatio;

  return pixelDensityRatio;
}
