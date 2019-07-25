function Channel(osdItemID, tileSource) {

    var _self = this;
    this.id = osdItemID;
    this.name = tileSource["channelName"] || "";
    this.rgb = tileSource["channelRGB"] || null;
    this.opacity = tileSource["channelAlpha"] || 1;;
    this.contrast = 1;
    this.brightness = 0;
    this.gamma = 0.875;
    this.hue = null;
    this.meterScaleInPixels = tileSource["meterScaleInPixels"];

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
        list.push(OpenSeadragon.Filters.CONTRAST(this.contrast));
    }

    if (this.brightness != null) {
        list.push(OpenSeadragon.Filters.BRIGHTNESS(this.brightness));
    }

    if (this.gamma != null) {
        list.push(OpenSeadragon.Filters.GAMMA(this.gamma));
    }

    if (this.hue != null) {
        list.push(OpenSeadragon.Filters.HUE(this.hue));
    }

    return list;
}

Channel.prototype.setDefaultHue = function () {
    if (this.rgb != null) {
        // get hue from rgb value.. 
        // presetHueValue = hueIs(rgb);
    }
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

Channel.prototype.setDefaultGamma = function () {

    if (this.blueColors.indexOf(this.name) != -1 || this.greenColors.indexOf(this.name) != -1 || this.redColors.indexOf(this.name) != -1) {
        this.gamma = 0.75;
    };
}


Channel.prototype.set = function (type, value) {
    if (!value || !type) { return }

    switch (type.toUpperCase()) {
        case "CONTRAST":
            this.contrast = value;
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
}
