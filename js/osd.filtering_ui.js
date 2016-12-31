//
// osd.filtering_ui.js
//
// setup & managing the filtering ui
// 

var filterList = [];
var showFilters = false;
var resetMode=false;

var redColors = ['Rhodamine', 'RFP', 'Alexa Fluor 555', 'Alexa Fluor 594', 'tdTomato', 'Alexa Fluor 633', 'Alexa Fluor 647']
var greenColors = ['FITC', 'Alexa 488', 'EGFP', 'Alexa Fluor 488']
var blueColors = ['DAPI']

//propertyList.push( { 'name': _name, 'cname':cname,  'itemID':i, 'opacity':1, 'hue':100, 'contrast': 10} );
var propertyList = [];
var initPropertyList=[]; // the initial property list

function setupFiltering()
{
// initial setting fo initPropertyList
  setTrackingPropertyList();
}

function isActive(elm) {
  if(elm.classList.contains("active")) {
    return 1;
    } else {
      return 0; 
  }
}

// this is filtering channels sidebar
function channelsClick()
{
  var nav = document.getElementById('nav-toggle');
window.console.log("nav is active..",isActive(nav));
  nav.classList.toggle( "active" );
window.console.log("and now nav is active..",isActive(nav));
  if(isActive(nav)) {
    sidebar_channels_slideOut();
//enable just for mei, testLoadingPropertyList();
    setTrackingPropertyList();
    } else {
      sidebar_channels_slideIn();
      savePropertyList();
  }
}

// preset
function presetGamma(i,name) {
  var presetGammaValue=0.875;
  if(  (blueColors.indexOf(name) != -1) 
    || (redColors.indexOf(name) != -1) 
    || (greenColors.indexOf(name) != -1) ) { 
      presetGammaValue=0.75;
  }
  return presetGammaValue;
}
// preset
function presetContrast(i) {
  var presetContrastValue=0;
  return presetContrastValue;
}

// preset
function presetBrightness(i) {
  var presetBrightnessValue=0;
  return presetBrightnessValue;
}

// rgb is a "0.000000 1.000000 0.200000"
function presetHue(rgb,name) {
  var presetHueValue=-1;
  if(rgb == null) {
     if(name == "unknown") { // default hue light blue
//    window.console.log("don't know the color type..");
      presetHueValue=180;
    } else if(name == "combo" || name == "TL Brightfield") {
      presetHueValue=-1;
    } else if(blueColors.indexOf(name) != -1) {
      presetHueValue=240;
    } else if(redColors.indexOf(name) != -1) {
      presetHueValue=0;
    } else if(greenColors.indexOf(name) != -1) {
      presetHueValue=120;
    }
    } else {
     // get hue from rgb value.. 
      presetHueValue=hueIs(rgb);
  }
  return presetHueValue;
}

function presetOpacity(alpha,i) {
  var presetOpacityValue=1;
  if(alpha != null) { 
    presetOpacityValue=alpha;
  }
  return presetOpacityValue;
}

// save what is in propertyList to the backend
// array of small json items
function savePropertyList() {
   var pp=JSON.stringify(propertyList);
   window.console.log(pp);
   uploadFilteringPropertyList('filteringPropertyList', pp);
}

function clonePropertyList(startList) {
   var _destList=[];
   for(var i=0; i<startList.length; i++) {
     var pp=JSON.parse(JSON.stringify(startList[i]));
     _destList.push(pp);
     window.console.log("--",pp);
   }
   return _destList;
}

// reuse the location
function copyPropertyListItem(startList,s,destList,d) {
  destList[d]=JSON.parse(JSON.stringify(startList[s]));
}

function setTrackingPropertyList() {
  initPropertyList=clonePropertyList(propertyList);
}

function _updateSliders() {
  for(var i=0; i<propertyList.length; i++) {
    updateItemSliders(i);
  }
}

// update the propertyList on demand and then
// update the viewer to reflect the new propertyList
function loadPropertyList(newPropertyList) {
  propertyList=clonePropertyList(newPropertyList);
  setTrackingPropertyList();
  _clearFilters();
  _addFilters();
  _updateSliders();
}

function makeSimpleProperty(name, cname, id) {

   var simpleP= { name: name,
                  cname: cname,
                  itemID: id,
                  opacity: 1,
                  hue: 240,
                  contrast: 0,
                  brightness: 100,
                  gamma: 1 };
   return simpleP;
}

function testLoadingPropertyList() {
   var nList=[];
   var a= { name: "DAPI", cname: "DAPI", itemID: 0, opacity: 1, hue: 240, contrast: 56, brightness: 100, gamma:1 };
   var aa= { name: "Alexa Fluor 488", cname: "AlexaFluor488", itemID: 1, opacity: 1, hue: 120, contrast: 0, brightness: 0, gamma:1};
   var aaa= { name: "Alexa Fluor 555", cname: "AlexaFluor555", itemID: 2, opacity: 1, hue: 0, contrast: 0, brightness: 50, gamma:1};
   var aaaa= { name: "combo", cname: "combo", itemID: 3, opacity: 1, hue: null, contrast: 0, brightness: 100, gamma:1};
   
   nList.push(a); nList.push(aa); nList.push(aaa); nList.push(aaaa);
   loadPropertyList(nList);
}

// initate dismiss of pull out from the chaise side
function dismissChannels() {
   var pp=JSON.stringify(propertyList);
   if(enableEmbedded) {
     dismissChannelsPullOut('dismissChannels', pp);
     } else {
      channelsClick();
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

function setupItemSliders(idx) {
  var p=propertyList[idx];
  var name=p['cname'];
//propertyList.push( { 'name': _name, 'cname':cname,  'itemID':i, 'opacity':1, 'hue':100, 'contrast': 10, 'brightness': 0, gamma:1);
  var _s='#'+name+'_opacity';
  var _sb=name+'_opacity_btn';
  var _c='#'+name+'_contrast';
  var _cb=name+'_contrast_btn';
  var _b='#'+name+'_brightness';
  var _bb=name+'_brightness_btn';
  var _h='#'+name+'_hue';
  var _hb=name+'_hue_btn';
  var _g='#'+name+'_gamma';
  var _gb=name+'_gamma_btn';

  var sbtn=document.getElementById(_sb);
  jQuery(_s).slider({
      slide: function( event, ui ) {
        sbtn.value=ui.value;
        _updateOpacity(name, ui.value);
      }
  });
  jQuery(_s).width(100 + '%');
  jQuery(_s).slider("option", "value", p['opacity']); // by default
  jQuery(_s).slider("option", "min", 0);
  jQuery(_s).slider("option", "max", 1);
  jQuery(_s).slider("option", "step", 0.1);

  var cbtn=document.getElementById(_cb);
  cbtn.value=p['contrast'];
  jQuery(_c).slider({
      slide: function( event, ui ) {
        cbtn.value=ui.value;
        _updateContrast(name,ui.value);
      }
  });
  jQuery(_c).width(100 + '%');
  jQuery(_c).slider("option", "value", p['contrast']);
  jQuery(_c).slider("option", "min", 0);
  jQuery(_c).slider("option", "max", 100);
  jQuery(_c).slider("option", "step", 2);

  var bbtn=document.getElementById(_bb);
  bbtn.value=p['brightness'];
  jQuery(_b).slider({
      slide: function( event, ui ) {
        bbtn.value=ui.value;
        _updateBrightness(name,ui.value);
      }
  });
  jQuery(_b).width(100 + '%');
  jQuery(_b).slider("option", "value", p['brightness']);
  jQuery(_b).slider("option", "min", -255);
  jQuery(_b).slider("option", "max", 255);
  jQuery(_b).slider("option", "step", 5);

  var gbtn=document.getElementById(_gb);
  gbtn.value=p['gamma'];
  jQuery(_g).slider({
      slide: function( event, ui ) {
        gbtn.value=ui.value;
        _updateGamma(name,ui.value);
      }
  });
  jQuery(_g).width(100 + '%');
  jQuery(_g).slider("option", "value", p['gamma']);
  jQuery(_g).slider("option", "min", 0);
  jQuery(_g).slider("option", "max", 3);
  jQuery(_g).slider("option", "step",0.125);

  var hbtn=document.getElementById(_hb);
  if(hbtn) {
    jQuery(_h).slider({
      slide: function( event, ui ) {
        hbtn.value=ui.value;
        _updateHue(name,ui.value);
      }
    });
    jQuery(_h).width(100 + '%');
    jQuery(_h).slider("option", "value", p['hue']);
    jQuery(_h).slider("option", "min", 0);
    jQuery(_h).slider("option", "max", 360);
    jQuery(_h).slider("option", "step", 10);
  }
}

function updateItemSliders(idx) {
  var p=propertyList[idx];
window.console.log("in updateItemSliders..", p);
  var name=p['cname'];
  var _s='#'+name+'_opacity';
  var _sb=name+'_opacity_btn';
  var _c='#'+name+'_contrast';
  var _cb=name+'_contrast_btn';
  var _b='#'+name+'_brightness';
  var _bb=name+'_brightness_btn';
  var _h='#'+name+'_hue';
  var _hb=name+'_hue_btn';
  var _g='#'+name+'_gamma';
  var _gb=name+'_gamma_btn';

  var sbtn=document.getElementById(_sb);
  sbtn.value=p['opacity'];
  jQuery(_s).slider("option", "value", p['opacity']); // by default

  var cbtn=document.getElementById(_cb);
  cbtn.value=p['contrast'];
  jQuery(_c).slider("option", "value", p['contrast']);

  var bbtn=document.getElementById(_bb);
  bbtn.value=p['brightness'];
  jQuery(_b).slider("option", "value", p['brightness']);

  var gbtn=document.getElementById(_gb);
  gbtn.value=p['gamma'];
  jQuery(_g).slider("option", "value", p['gamma']);

// this hbtn is actually optional
  var hbtn=document.getElementById(_hb);
  if(hbtn) {
    hbtn.value=p['hue'];
    jQuery(_h).slider("option", "value", p['hue']);
  }
}


window.onload = function() {
  for (var i = 0; i < propertyList.length; i++) {
    setupItemSliders(i);
  }
}

// squeeze out all spaces in name
function addItemListEntry(n,i,dir,hue,contrast,brightness,opacity,gamma,alias=null) {
  var name = n.replace(/ +/g, "");
  var _name=n;
  var _collapse_name=i+'_collapse';
  var _visible_name=i+'_visible';
  var _reset_name=name+'_reset';
  var _reset_btn=name+'_reset_btn';
  var _hue_name=name+'_hue';
  var _hue_btn=name+'_hue_btn';
  var _opacity_name=name+'_opacity';
  var _opacity_btn=name+'_opacity_btn';
  var _contrast_name=name+'_contrast';
  var _contrast_btn=name+'_contrast_btn';
  var _brightness_name=name+'_brightness';
  var _brightness_btn=name+'_brightness_btn';
  var _gamma_name=name+'_gamma';
  var _gamma_btn=name+'_gamma_btn';
  var _hue_init_value=hue;
  var _contrast_init_value=contrast;
  var _brightness_init_value=brightness;
  var _opacity_init_value=opacity;
  var _gamma_init_value=gamma;

  var _nn='';
//hue hint from http://hslpicker.com/#00e1ff
 var aname=name;
 if(alias != null)
   aname=alias;

_nn+='<div class="panel panel-default col-md-12">';
_nn+='<div class="panel-heading"><div class="row panel-title" style="background-color:transparent;">'
_nn+='<button id="'+_visible_name+'" class="pull-left"  style="display:inline-block;outline: none;border:none; background-color:white"  onClick="toggleItem('+i+',\'eye_'+name+'\')" title="hide or show channel"><span id="eye_'+name+'" class="glyphicon glyphicon-eye-open" style="color:#337ab7;"></span> </button>';
_nn+='<a class="accordion-toggle" data-toggle="collapse" data-parent="#itemList" href="#' +_collapse_name+'" title="click to expand" >'+aname+'</a> </div></div>';
_nn+=' <div id="'+_collapse_name+'" class="panel-collapse collapse"> <div class="panel-body">';

_nn+= ' <div id="'+name+ '" title="restore settings" class="row" style="background-color:white;opacity:1;"> <button id="'+_reset_btn+ '" type="button" class="btn btn-xs btn-primary pull-right" onclick="toggleResetItem('+ i+ ','+ '\''+ name+ '\');" style="font-size:12px;margin-top:2px; margin-right:20px" >Reset</button><div class="filtercontrol">';

//contrast slider...
_nn+= '<div class="col-md-12 filter-slider"> <div class="menuLabel">Contrast<input id="'+ _contrast_btn+'" type="button" class="btn btn-info pull-right"  value="0" style="color:black; background:white; height:16px; width:30px; font-size:12px; padding:0px;"></div> <div id="'+ _contrast_name+'" class="slider" style="background:#337ab7;"> </div></div>';

//brightness slider...
_nn+= '<div class="col-md-12 filter-slider"> <div class="menuLabel">Brightness<input id="'+ _brightness_btn+'" type="button" class="btn btn-info pull-right"  value="0" style="color:black; background:white; height:16px; width:30px; font-size:12px; padding:0px;"> </div> <div id="'+_brightness_name+'" class="slider" style="background:#337ab7;"> </div> </div>';

//gamma slider...
_nn+= '<div class="col-md-12 filter-slider"> <div class="menuLabel">Gamma<input id="'+ _gamma_btn+'" type="button" class="btn btn-info pull-right"  value="1" style="color:black; background:white; height:16px; width:30px; font-size:12px; padding:0px;"> </div> <div id="'+_gamma_name+'" class="slider" style="background:#337ab7;"> </div> </div>';

// opacity slider... disable by default 
_nn+= '<div class="col-md-12 filter-slider" style="display:none"> <div class="menuLabel">Opacity<input id="'+_opacity_btn+'" type="button" class="btn btn-info pull-right" value="1" style="color:black; background:white; height:16px; width:30; margin-left:10px; font-size:12px; padding:0px;"> </div> <div id="'+_opacity_name+'" class="slider" style="background:grey;"> </div> </div>';


//hue slider
if(hue >= 0) {
_nn+= '<div class="col-md-12 filter-slider"> <div class="menuLabel">Hue<input id="'+ _hue_btn+'" type="button" class="btn btn-info pull-right" value="240" style="color:black; background:white; height:16px; width:30px; margin-left:10px; font-size:12px; padding:0px;"> </div> <div class="slider h-slider" id="'+ _hue_name+'"> </div> </div>';
} else { 
// this is a combo or unknown type --> rgb 
}

// last bits
_nn+= '</div> </div> </div> <!-- panel-body --> </div> </div> <!-- panel -->';

  jQuery('#itemList').append(_nn);
window.console.log(_nn);
}

// this is called when any of the hue/contrast slider got touched
function _addFilters() {
   filterList=[];
   jQuery('.filtercontrol').show();
   for(i=0;i<propertyList.length;i++) {
     var p=propertyList[i];
//propertyList.push( { 'name': _name, 'itemID':i, 'opacity':1, 'hue':100, 'contrast': 10, 'brightness':100, 'gamma':0} );
     _addFilter(p['itemID'],p['hue'],p['contrast'],p['brightness'],p['gamma']);
   }
   myViewer.setFilterOptions({
     filters: filterList
   })
}

function _clearFilters() {
   jQuery('.filtercontrol').hide();
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

function toggleFiltering() {
  showFilters = ! showFilters;
  if(showFilters) {
    _addFilters();
    jQuery('#filtersBtn').prop('value','Remove Filters');
    } else {
      _clearFilters();
      jQuery('#filtersBtn').prop('value','Add Filters');
  }
}

function resetFiltering() {
  _clearFilters();
}

function _addInvertFilter(ItemID) {
   filterList.push(
      { items: [ myViewer.world.getItemAt(ItemID) ],
        processors: [ OpenSeadragon.Filters.INVERT() ]
      });
}

function _addFilter(ItemID, angle, contrast, brightness, gamma) {
   var p=myViewer.world.getItemAt(ItemID);

   // get the initial(stored) filter list, 
   // skip the one that remained the same
   var plist=[];
   var initIdx=findPropertyByItemId(initPropertyList, ItemID);
   if(initIdx ==null) {
     window.console.log("PANIC..");
     return;
   }
   if(resetMode || initPropertyList[initIdx]['contrast']!=contrast)
     plist.push(OpenSeadragon.Filters.CONTRAST(contrast));
   if(resetMode || initPropertyList[initIdx]['brightness']!=brightness)
     plist.push(OpenSeadragon.Filters.BRIGHTNESS(brightness));
// since GAMMA default (0.75) is not the 'base' identity (1), always have
// to include the GAMMA
   if(resetMode || initPropertyList[initIdx]['gamma']!=gamma)
       plist.push(OpenSeadragon.Filters.GAMMA(gamma));
   if(!resetMode)
     plist.push(OpenSeadragon.Filters.GAMMA(gamma));
   if(angle < 0) { // special case.. this is a RGB full colored image
     filterList.push( {
        items: [myViewer.world.getItemAt(ItemID) ],
        processors: plist
     });
     } else { 
// HUE always get called.
//       plist.push(OpenSeadragon.Filters.INVERT());
       plist.push(OpenSeadragon.Filters.HUE(angle));
       filterList.push( {
          items: [myViewer.world.getItemAt(ItemID) ],
          processors: plist
       });
   }
}

function _updateContrast(name, newContrast) {
  for(i=0; i<propertyList.length; i++) {
     if( propertyList[i]['cname'] == name) {
       var _i=propertyList[i]['itemID'];
       propertyList[i]['contrast']=newContrast;
       _addFilters();
       return;
     }
  }
  alertify.error("_updateContrast should never be here");
}

function _updateBrightness(name, newBrightness) {
  for(i=0; i<propertyList.length; i++) {
     if( propertyList[i]['cname'] == name) {
       var _i=propertyList[i]['itemID'];
       propertyList[i]['brightness']=newBrightness;
       _addFilters();
       return;
     }
  }
  alertify.error("_updateBrightness should never be here");
}

function _updateGamma(name, newGamma) {
  for(i=0; i<propertyList.length; i++) {
     if( propertyList[i]['cname'] == name) {
       var _i=propertyList[i]['itemID'];
       propertyList[i]['gamma']=newGamma;
       _addFilters();
       return;
     }
  }
  alertify.error("_updateGamma should never be here");
}


// after property entry is updated with hue, the initial
// setting of using rgb is not used anymore..
function _updateHue(name, newHue) {
  for(i=0; i<propertyList.length; i++) {
     if( propertyList[i]['cname'] == name) {
       var _i=propertyList[i]['itemID'];
       propertyList[i]['hue']=newHue;
       _addFilters();
       return;
     }
  }
  alertify.error("_updateHue should never be here");
}

function _getOpacityByID(itemID) {
  for(i=0; i<propertyList.length; i++) {
     if( propertyList[i]['itemID'] == itemID) {
        var p=propertyList[i]['opacity'];
        return p;
     }
  }
  alertify.error("_getOpacityByID should never be here");
}

function _updateOpacity(name, newOpacity) {
  for(i=0; i<propertyList.length; i++) {
     if( propertyList[i]['cname'] == name) {
       var _i=propertyList[i]['itemID'];
       propertyList[i]['opacity']=newOpacity;
       item=myViewer.world.getItemAt(_i);
       item.setOpacity(newOpacity);
       return;
     }
  }
  alertify.error("_updateOpacity should never be here");
}

function findPropertyByItemId(plist, item) {
  var _ii=initPropertyList;
  var _pp=propertyList;
  for(var i=0; i<plist.length; i++) {
    var tmp=plist[i];
    if(item == tmp.itemID) {
      return i;
    }
  }
  return null;
}  

function toggleResetItem(itemID, itemLabel) {
  var item=myViewer.world.getItemAt(itemID);
  /* reset the current set to the initial set */
  var s=null; /* index in the current set */
  var d=null; /* index in the initial set */
  var stmp;
  var dtmp;
if(propertyList.length != initPropertyList.length) {
window.console.log("bad panic..",propertyList.length," - ", initPropertyList.length);
}
  for(var i=0; i<propertyList.length; i++) {
    stmp=initPropertyList[i];
    dtmp=propertyList[i];
    if(itemLabel == stmp.cname) { s=i; }
    if(itemLabel == dtmp.cname) { d=i; }
    if(s!=null && d!=null ) {
      break;
    }
  }
  if(s!=null && d!=null ) {
    copyPropertyListItem(initPropertyList,s,propertyList,d);
    } else {
      window.console.log("hum.. BAD");
  }
  updateItemSliders(s);
  // redraw the image
  _clearFilters();
  resetMode=true;
  _addFilters();
  resetMode=false;
}

/* 0 , 1 */
function toggleItem(itemID, itemLabel) {
  var item=myViewer.world.getItemAt(itemID);
  var tmp='#'+itemLabel;
  var eptr = $(tmp);
  var op=item.getOpacity();
  if (op > 0) {
    item.setOpacity(0);
    eptr.removeClass('glyphicon-eye-open').addClass('glyphicon-eye-close');
    } else {
      op=_getOpacityByID(itemID);
      item.setOpacity(op);
      eptr.removeClass('glyphicon-eye-close').addClass('glyphicon-eye-open');
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

//"0.000000 1.000000 0.200000"
function _rgb2hsl(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; 
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
//  hue = h * 360;
    return [h, s, l];
}

function hueIs(rgb) {
    var _rgb=rgb.split(" ");
    var p=_rgb2hsl(parseFloat(_rgb[0]), parseFloat(_rgb[1]), parseFloat(_rgb[
2]));
    var hue = p[0] * 360;
    return hue;
}

//
// used by filtering
//
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
