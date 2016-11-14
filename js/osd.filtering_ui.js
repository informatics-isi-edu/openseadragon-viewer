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

//propertyList.push( { 'name': _name, 'cname':cname,  'itemID':i, 'opacity':1, 'hue':100, 'contrast': 10, 'normalize': [min, max] } );
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

// this is filtering control sidebar
function ctrlClick()
{
  var nav = document.getElementById('nav-toggle');
  nav.classList.toggle( "active" );
  if(isActive(nav)) {
    sidebar_control_slideOut();
//enable just for mei, testLoadingPropertyList();
    setTrackingPropertyList();
    } else {
      sidebar_control_slideIn();
      savePropertyList();
  }
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

// save what is in propertyList to the backedn
// array of small json items
function savePropertyList() {
   var plist=[];
   for(var i=0; i<propertyList.length; i++) {
     var p=propertyList[i];
     var j=JSON.stringify(p,null,2);
     window.console.log(j);
   }
   uploadFilteringPropertyList('filteringPropertyList', plist);
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
/*
   destList[d]['contrast']=startList[s]['contrast'];
   destList[d]['opacity']=startList[s]['opacity'];
   destList[d]['hue']=startList[s]['hue'];
*/
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
                  hue: xx,
                  contrast: xx,
                  brightness: 100,
                  normalize: [0,1] };
   return simpleP;
}

function testLoadingPropertyList() {
   var nList=[];
   var a= { name: "DAPI", cname: "DAPI", itemID: 0, opacity: 1, hue: 240, contrast: 56, brightness: 100, normalize: [0,1] };
   var aa= { name: "Alexa Fluor 488", cname: "AlexaFluor488", itemID: 1, opacity: 1, hue: 120, contrast: 0, brightness: 0, normalize: [0,1] };
   var aaa= { name: "Alexa Fluor 555", cname: "AlexaFluor555", itemID: 2, opacity: 1, hue: 0, contrast: 0, brightness: 50, normalize: [0,1] };
   var aaaa= { name: "combo", cname: "combo", itemID: 3, opacity: 1, hue: null, contrast: 0, brightness: 100, normalize: [0,1] };
   
   nList.push(a); nList.push(aa); nList.push(aaa); nList.push(aaaa);
   loadPropertyList(nList);
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
//propertyList.push( { 'name': _name, 'cname':cname,  'itemID':i, 'opacity':1, 'hue':100, 'contrast': 10, 'brightness': 0, normalize: [0,1] } );
  var _s='#'+name+'_opacity';
  var _sb=name+'_opacity_btn';
  var _c='#'+name+'_contrast';
  var _cb=name+'_contrast_btn';
  var _b='#'+name+'_brightness';
  var _bb=name+'_brightness_btn';
  var _h='#'+name+'_hue';
  var _hb=name+'_hue_btn';

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
  jQuery(_c).slider("option", "min", -100);
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

  var hbtn=document.getElementById(_hb);
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

  var sbtn=document.getElementById(_sb);
  sbtn.value=p['opacity'];
  jQuery(_s).slider("option", "value", p['opacity']); // by default
  var cbtn=document.getElementById(_cb);
  cbtn.value=p['contrast'];
  jQuery(_c).slider("option", "value", p['contrast']);
  var bbtn=document.getElementById(_bb);
  bbtn.value=p['brightness'];
  jQuery(_b).slider("option", "value", p['brightness']);
// this hbtn is actually optional
  var hbtn=document.getElementById(_hb);
  if(hbtn) {
    hbtn.value=p['hue'];
    jQuery(_h).slider("option", "value", p['hue']);
  }
}


window.onload = function() {
  if (propertyList && propertyList.length < 2 && propertyList.length>0) {
      jQuery('#itemList').prepend('<h5>'+propertyList[0].name+'</h5>');
  }

  var dropdown = document.getElementById('channels-list');
  var channels = '';
  for (var i = 0; i < propertyList.length; i++) {
    channels += '<option value="' + propertyList[i].cname + '">' + propertyList[i].name + '</option>';
    setupItemSliders(i);
  }
  dropdown.innerHTML = channels;

  $('.channel').hide();
  $('.channel').eq(0).show();
  var numChannels = $('.channel').length;
  if (numChannels < 2) {
    $('#channels-list').hide();
// suppress the visibility check-button if here is just 1 channel
    var _visible_name='0_visible'; // should only have one
    var v = document.getElementById(_visible_name);
    v.style.display='none';
  }

  $('#channels-list').change(function() {
    var channel = $('#channels-list').find('option:selected').val();
    $('.channel').hide();
    $('#'+channel).show();
  });
}

// squeeze out all spaces in name
function addItemListEntry(n,i,label,hue,contrast,brightness,opacity) {
  var name = n.replace(/ +/g, "");
  var _name=n;
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
  var _hue_init_value=hue;
  var _contrast_init_value=contrast;
  var _brightness_init_value=brightness;
  var _opacity_init_value=opacity;

  var _nn='';
//hue hint from http://hslpicker.com/#00e1ff
  _nn+='<div id="' +name+ '" class="row channel"><div class="col-md-12 item "><div class="data" style="font-size:small;letter-spacing:1px;"><div id="'+_visible_name+'"><label for ="' +_name+ '" >Visible?</label> <input type="checkbox" class="pull-right" id="'+_name+'" checked="" style="margin-right:40px"  onClick="toggleItem('+i+','+'\''+_name+'\');" /></div><div><label for ="' +_reset_btn+ '" >Reset?</label> <input type="button" class="btn btn-sm btn-primary pull-right" id="'+_reset_btn+'" style="margin-right:40px"  onClick="toggleResetItem('+i+','+'\''+_name+'\');" /></div></div>';
  _nn+='<div class="row filtercontrol">';
  _nn+='<div class="col-md-12 filter-slider"><div class="menuLabel">Contrast<input id=\''+_contrast_btn+'\' type="button" class="btn btn-info pull-right"  value=\''+_contrast_init_value+'\' style="color:black; background:white; height:16px; width:24px; font-size:12px; padding:0px;"></div><div id=\''+_contrast_name+'\' class="slider" style="background:yellow;"></div></div>';
  _nn+='<div class="col-md-12 filter-slider"><div class="menuLabel">Brightness<input id=\''+_brightness_btn+'\' type="button" class="btn btn-info pull-right"  value=\''+_brightness_init_value+'\' style="color:black; background:white; height:16px; width:24px; font-size:12px; padding:0px;"></div><div id=\''+_brightness_name+'\' class="slider" style="background:green;"></div></div>';
  _nn+='<div class="col-md-12 filter-slider" style="display:none"><div class="menuLabel">Opacity<input id=\''+_opacity_btn+'\' type="button" class="btn btn-info pull-right" value=\''+_opacity_init_value+'\' style="color:black; background:white; height:16px; width:24px; margin-left:10px; font-size:12px; padding:0px;"></div><div id=\''+_opacity_name+'\' class="slider" style="background:grey;"></div></div>';
if(hue >= 0) {
  _nn+='<div class="col-md-12 filter-slider"><div class="menuLabel">Hue<input id=\''+_hue_btn+'\' type="button" class="btn btn-info pull-right" value=\''+_hue_init_value+'\' style="color:black; background:white; height:16px; width:24px; margin-left:10px; font-size:12px; padding:0px;"></div><div class="slider h-slider" id=\''+_hue_name+'\'></div></div></div>';
  } else { // this is a combo or unknown type --> rgb
}
  _nn+='</div></div></div>';
  jQuery('#itemList').append(_nn);
// window.console.log(_nn);
}

// this is called when any of the hue/contrast slider got touched
function _addFilters() {
   filterList=[];
   jQuery('.filtercontrol').show();
   for(i=0;i<propertyList.length;i++) {
     var p=propertyList[i];
//propertyList.push( { 'name': _name, 'itemID':i, 'opacity':1, 'hue':100, 'contrast': 10, 'brightness':100, 'normalize':[0,1]] } );
     _addFilter(p['itemID'],p['hue'],p['contrast'],p['brightness'],p['normalize']);
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

function _addFilter(ItemID, angle, contrast, brightness, normval) {
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
   if(angle < 0) { // special case.. this is a RGB full colored image
     filterList.push( {
        items: [myViewer.world.getItemAt(ItemID) ],
        processors: plist
     });
     } else { 
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
    if(itemLabel == stmp.name) { s=i; }
    if(itemLabel == dtmp.name) { d=i; }
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
  var op=item.getOpacity();
  if (op > 0) {
    item.setOpacity(0);
    } else {
      op=_getOpacityByID(itemID);
      item.setOpacity(op);
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
