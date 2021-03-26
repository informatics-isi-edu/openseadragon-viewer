function Constants () {
    var _self = this;

    Object.defineProperty(_self,'CHANNEL_CONFIG', { 
        value: {
            CONTRAST: "contrast",
            BRIGHTNESS: "brightness",
            GAMMA: "gamma",
            SATURATION: "saturation",
            HUE: "hue",
            DISPLAY_GREYSCALE: "display_greyscale"
        },
        writable: false 
    });
    
}
