function Constants () {
    var _self = this;

    Object.defineProperty(_self,'CHANNEL_CONFIG', { 
        value: {
            BLACK_LEVEL: "black_level_uint8",
            WHITE_LEVEL: "white_level_uinit8",
            GAMMA: "gamma",
            SATURATION: "saturation_percent",
            HUE: "hue_degree",
            DISPLAY_GREYSCALE: "display_greyscale"
        },
        writable: false 
    });
    
}
