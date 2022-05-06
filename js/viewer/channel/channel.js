function Channel(osdItemID, name, number, options) {
    options = options || {};

    var _self = this;
    this.id = osdItemID;
    this.name = (typeof name === "string") ? name : "";
    this.name = this.name.replace(/\_/g, " ");
    this.number=  number;
    this.isRGB = (typeof options['isRGB'] === 'boolean') ? options['isRGB'] : null;
    this.pseudoColor = options["pseudoColor"] || null;
    this.width = +options["width"] || 0;
    this.height = +options["height"] || 0;

    this.isMultiChannel = (options["isMultiChannel"] === true);

    var colorConfig = (typeof options['channelConfig'] === "object" && options['channelConfig'] != null) ? options['channelConfig'] : {};
    var configConst = window.OSDViewer.constants.CHANNEL_CONFIG;

    this.blackLevel = _populateAttributeByConfig(this, colorConfig, configConst.BLACK_LEVEL, 0);
    this.whiteLevel = _populateAttributeByConfig(this, colorConfig, configConst.WHITE_LEVEL, 255);
    this.gamma = _populateAttributeByConfig(this, colorConfig, configConst.GAMMA, null, _populateDefaultGamma);
    this.saturation = _populateAttributeByConfig(this, colorConfig, configConst.SATURATION, 100);

    // we might want to offer hue control but not apply it by default.
    // for example in case of a greyscale image with an unknown channelName
    this.displayGreyscale = colorConfig[configConst.DISPLAY_GREYSCALE] === true;

    /**
     * the first displayed hue value to the users.
     */
    this.hue = _populateDefaultHue(this, colorConfig[configConst.HUE]);

    this.isDisplay = (typeof options["isDisplay"] === "boolean") ? options["isDisplay"] : true;
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

Channel.prototype.getFiltersList = function (isInit) {
    var list = [];

    // TODO The filter should be moved here. there's no point in having it in the channel-filter.js
    // and most probably we should change it so it's not accepting array of filters
    list.push(
        OpenSeadragon.Filters.CHANGE_COLOR(
            this.name,
            isInit,
            this.blackLevel, this.whiteLevel, this.gamma, // set v
            this.saturation,  // set s
            this.hue, this.displayGreyscale,  // set h
        )
    );

    return list;
};

function _populateAttributeByConfig(self, config, configAttr, defaultVal, defaultFn) {
    var res;
    if (configAttr in config) {
        res = parseFloat(config[configAttr]);
    }
    if (res == null || isNaN(res)) {
        if (defaultVal != null) {
            res = defaultVal;
        }
        if (defaultFn != null) {
            res = defaultFn(self);
        }
    }
    return res;
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


/**
 * Given a rgb color value, return the hue
 */
function hueIs(rgb) { // Copied from old code  - need to how this works and when
    if (typeof rgb != "string" || rgb.length == 0) {
        return null;
    }
    var _rgb=rgb.split(" ");

    // some shade of grey, so the hue of the color is useless
    if (_rgb[0] == _rgb[1] && _rgb[1] == _rgb[2]) {
        return null;
    }

    var p=_rgb2hsl(parseFloat(_rgb[0]), parseFloat(_rgb[1]), parseFloat(_rgb[2]));
    var hue = p[0] * 360;
    return Math.round(hue);
}

/**
 * Populate the default hue value that should be used (it will show greyscale or hide the control if needed)
 * - if isRGB=true -> null (no hue control)
 * - if pseudoColor != null and color is valid (not grey/white/black) -> the hue value of pseudoColor
 * - if channelConfig.hue is defined and valid -> use it.
 * - if channelName in the list -> the hue value based on what's defined
 * - if isRGB=null, and (single-channel or combo/Brightfield) -> null (no hue control)
 * - otherwise -> use the default color and show greyscale by default
 */
function _populateDefaultHue(self, channelConfigHue) {
    // if isRGB=true, then disable the hue control
    if (self.isRGB === true) {
        return null;
    }

    // if color is defined, offer hue control with the given color
    if (self.pseudoColor != null) {
        var hue = hueIs(self.pseudoColor);
        // if the given color is not a valid one (not a color, or any greyscale) don't use the color
        if (hue != null) {
            return hue;
        } else {
            window.OSDViewer.alertService.showPseudoColorAlert(self);
        }
    }

    // if channelConfig.hue is defined and valid, use it
    if (channelConfigHue != null) {
        var temp = parseFloat(channelConfigHue);
        if (temp != null && !isNaN(temp)) {
            return temp;
        }
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
    self.displayGreyscale = true; // show the greyscale image
    return 0; //default value
}

function _populateDefaultGamma (self) {
    if (self.name in self.colorMapping) {
        return 0.55;
    }
    return 0.875;
}

Channel.prototype.setMultiple = function (settings) {
    var self = this, type;
    for(type in settings) {
        if (settings.hasOwnProperty(type) && type != "displayGreyscale") {
            self.set(type, settings[type]);
        }
    }

    // changing hue and saturation will change this value
    // if displayGreyscale is passed, we have to make sure we're honoring
    // it and not changing it based on hue or saturation change
    type = "displayGreyscale";
    if (type in settings) {
        self.set(type, settings[type]);
    }
}


Channel.prototype.set = function (type, value) {
    if (typeof type !== "string") type = "";

    switch (type) {
        case "blackLevel":
        case "whiteLevel":
        case "gamma":
            this[type] = value;
            break;
        case "saturation":
            this.saturation = value;

            // make sure saturation value applied
            this.displayGreyscale = false;
            break;
        case "hue":
            this.hue = value;
            // make sure hue value applied
            this.displayGreyscale = false;
            break;
        case "displayGreyscale":
            this.displayGreyscale = (value === true);
            break;
        default:
            break;
    }

    // make sure the label is updated
    this.updateOverlayColor();
}

Channel.prototype.setIsDisplay = function (isDisplay) {
    this.isDisplay = (isDisplay == true);
}


Channel.prototype.setOverlayElement = function (el) {
    this.overlayElement = el;
}

Channel.prototype.updateOverlayColor = function () {
    try {
        this.overlayElement.setAttribute("style", "color: " + this.getOverlayColor());
    } catch (exp) {
        // the overlay might not be visible
    }
}

Channel.prototype.getOverlayColor = function() {
    if (this.displayGreyscale) {
        return "#ccc";
    }
    if (this.hue != null) {
        return 'rgb(' + OSDViewer.utils.hsv2rgb(this.hue, 1, 1) + ')';
    }
    return 'white';
}
