function Channel(osdItemID, options) {

    var _self = this;
    this.id = osdItemID;
    this.name = options["channelName"] || "";
    this.rgb = options["channelRGB"] || null;
    this.opacity = options["channelAlpha"] || 1;;
    this.width = +options["width"] || 0;
    this.height = +options["height"] || 0;
    this.contrast = 1;
    this.brightness = 0;
    this.gamma = 0.875;
    this.hue = null;
    this.initialProperty = {
      contrast: 100,
      brightness: 0,
      gamma: 0.875,
      hue: null,
    }

    // Set Default Values
    this.setDefaultHue();
    this.setDefaultGamma();
}

Channel.prototype.redColors = ['Rhodamine', 'RFP', 'Alexa Fluor 555', 'Alexa Fluor 594', 'tdTomato', 'Alexa Fluor 633', 'Alexa Fluor 647'];
Channel.prototype.greenColors = ['FITC', 'Alexa 488', 'EGFP', 'Alexa Fluor 488'];
Channel.prototype.blueColors = ['DAPI'];

Channel.prototype.getFiltersList = function () {
    var list = [];

    if (this.contrast != null) {
      if (this.contrast != this.initialProperty.contrast) {
        list.push(OpenSeadragon.Filters.CONTRAST(this.contrast));
      }
    }

    if (this.brightness != null) {
      if (this.brightness != this.initialProperty.brightness) {
        list.push(OpenSeadragon.Filters.BRIGHTNESS(this.brightness));
      }
    }

    if (this.gamma != null) {
        list.push(OpenSeadragon.Filters.GAMMA(this.gamma));
    }

    if (this.hue != null) {
        list.push(OpenSeadragon.Filters.HUE(this.hue));
    }
    console.log("list", list);
    return list;
}

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



function hueIs(rgb) { // Copied from old code  - need to how this works and when
    var _rgb=rgb.split(" ");
    var p=_rgb2hsl(parseFloat(_rgb[0]), parseFloat(_rgb[1]), parseFloat(_rgb[2]));
    var hue = p[0] * 360;
    return hue;
}

Channel.prototype.setDefaultHue = function () {
    if (this.rgb != null) {
        // get hue from rgb value..
        this.hue = hueIs(this.rgb);
    } else {
      switch (this.name) {
          case "unknown":
              this.hue = 180;
              break;
          case "combo":
          case "TL Brightfield":
              this.hue = null;
              break;
          default:
              // Blue colors
              this.hue = this.blueColors.indexOf(this.name) != -1 ? 240 : this.hue;
              // Green colors
              this.hue = this.greenColors.indexOf(this.name) != -1 ? 120 : this.hue;
              // Red colors
              this.hue = this.redColors.indexOf(this.name) != -1 ? 0 : this.hue;
              break;
      }
    }
    this.initialProperty.hue = this.hue;

}

Channel.prototype.setDefaultGamma = function () {

    if (this.blueColors.indexOf(this.name) != -1 || this.greenColors.indexOf(this.name) != -1 || this.redColors.indexOf(this.name) != -1) {
        this.gamma = 0.75;
        this.initialProperty.gamma = this.gamma;
    };
}


Channel.prototype.set = function (type, value) {
    console.log(
      "channel set" , type, value
    );
    if (!type) { return }

    switch (type.toUpperCase()) {
        case "CONTRAST":
            this.contrast = value*100;
            break;
        case "BRIGHTNESS":
            this.brightness = value;
            break;
        case "GAMMA":
            this.gamma = value;
            break;
        case "HUE":
            this.hue = value;
            break;
    }
 //    if(!resetMode)
 //      plist.push(OpenSeadragon.Filters.GAMMA(gamma));
 //    if(this,hue < 0) { // special case.. this is a RGB full colored image
 //      filterList.push( {
 //         items: [myViewer.world.getItemAt(ItemID) ],
 //         processors: plist
 //      });
 //      } else {
 // // HUE always get called.
 // //       plist.push(OpenSeadragon.Filters.INVERT());
 //        plist.push(OpenSeadragon.Filters.HUE(angle));
 //        filterList.push( {
 //           items: [myViewer.world.getItemAt(ItemID) ],
 //           processors: plist
 //        });
 //    }
}
