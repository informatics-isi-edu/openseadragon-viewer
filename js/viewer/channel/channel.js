function Channel(osdItemID, name, number, options) {
    options = options || {};

    var _self = this;
    this.id = osdItemID;
    this.name = (typeof name === "string") ? name : "";
    this.name = this.name.replace(/\_/g, " ");
    this.number=  number;
    this.isRGB = (typeof options['isRGB'] === 'boolean') ? options['isRGB'] : null;
    this.rgb = options["pseudoColor"] || null;
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
    };

    this.isDisplay = (typeof options["isDisplay"] === "boolean") ? options["isDisplay"] : true;

    this.isMultiChannel = (options["isMultiChannel"] === true);

    // we might want to offer hue control but not apply it by default.
    // for example in case of a greyscale image with an unknown channelName
    this.deactivateHue = false;

    // Set Default Values
    this.setDefaultHue();
    this.setDefaultGamma();
}


Channel.prototype.colorMapping = {
    // far red (magenta)
    'Alexa Fluor 633': '1.000000 0.000000 1.000000',
    'Alexa Fluor 647': '1.000000 0.000000 1.000000',

    // red
    'Rhodamine': '1.000000 0.000000 0.000000',
    'RFP': '1.000000 0.000000 0.000000',
    'Alexa Fluor 555': '1.000000 0.000000 0.000000',
    'Alexa Fluor 594': '1.000000 0.000000 0.000000',
    'tdTomato': '1.000000 0.000000 0.000000',
    'mcherry': '1.000000 0.000000 0.000000',

    //green
    'FITC': '0.000000 1.000000 0.000000',
    'Alexa 488': '0.000000 1.000000 0.000000',
    'EGFP': '0.000000 1.000000 0.000000',
    'Alexa Fluor 488': '0.000000 1.000000 0.000000',

    //blue
    'DAPI': '0.000000 0.000000 1.000000',
    'Hoechst': '0.000000 0.000000 1.000000'
};

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

    // only apply hue if it's activated
    if (this.hue != null && !this.deactivateHue) {
        list.push(OpenSeadragon.Filters.HUE(this.hue));
    }

    // console.log("list", list);
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
    if (typeof rgb != "string" || rgb.length == 0) {
        return null;
    }
    var _rgb=rgb.split(" ");
    var p=_rgb2hsl(parseFloat(_rgb[0]), parseFloat(_rgb[1]), parseFloat(_rgb[2]));
    var hue = p[0] * 360;
    return Math.round(hue);
}

/**
 * Populate the default hue value that should be used (it will deactivate or hide the control if needed)
 * - if isRGB=true -> null (no hue control)
 * - if rgb!= null (pseudoColor) -> the hue value of rgb
 * - if channelName in the list -> the hue value based on what's defined
 * - if isRGB=null, and (single-channel or combo/Brightfield) -> null (no hue control)
 * - otherwise -> use the default color and deactivate hue control by default
 */
function _populateDefaultHue(self) {
    // if isRGB=true, then disable the hue control
    if (self.isRGB === true) {
        return null;
    }

    // if color is defined, offer hue control with the given color
    if (self.rgb != null) {
        return hueIs(self.rgb);
    }

    // if channelName is found in our list, use the default color
    if (self.name in self.colorMapping) {
        return hueIs(self.colorMapping[self.name]);
    }

    // if isRGB is not defined and,
    //  - single channel
    //  - or if combo/Brightfield:
    // disable the hue control
    if (self.isRGB == null && (!self.isMultiChannel || ["TL Brightfield", "combo"].indexOf(self.name) != -1)) {
        return null;
    }

    // - isRGB is not defined and it's multi-channel
    // - or isRGB=false and channelName wasn't found:
    self.deactivateHue = true; // deactivate hue control
    return 0; //default value
}

Channel.prototype.setDefaultHue = function () {
    this.hue = _populateDefaultHue(this);

    this.initialProperty.hue = this.hue;
};

Channel.prototype.setDefaultGamma = function () {
    if (this.name in this.colorMapping) {
        this.gamma = 0.75;
        this.initialProperty.gamma = this.gamma;
    };
}


Channel.prototype.set = function (type, value) {
    // console.log(
    //   "channel set" , type, value
    // );
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
            // activate the hue control so the value change takes effect
            this.deactivateHue = false;
            break;
        case "DEACTIVATEHUE":
            this.deactivateHue = (value === true);
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

Channel.prototype.setIsDisplay = function (isDisplay) {
    this.isDisplay = (isDisplay == true);
}
