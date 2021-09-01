function Constants () {
    var _self = this;

    Object.defineProperty(_self,'CHANNEL_CONFIG', {
        value: {
            BLACK_LEVEL: "black_level_uint8",
            WHITE_LEVEL: "white_level_uint8",
            GAMMA: "gamma",
            SATURATION: "saturation_percent",
            HUE: "hue_degree",
            DISPLAY_GREYSCALE: "display_greyscale"
        },
        writable: false
    });

    Object.defineProperty(_self,'RELOAD_CAUSES', {
        value: {
            PAGE_LIMIT: "page-limit", // change page limit
            PAGE_NEXT: "page-next", // go to next page
            PAGE_PREV: "page-prev", // go to previous page
            DEFAULT_Z: "default-z", // initial request for default z
            SLIDER: "slider", // slider changed
            SEARCH_BOX: "search-box" // search-box value changed
        },
        writable: false
    });

    Object.defineProperty(_self, 'CHANNEL_NAMES_OVERLAY_CONFIG', {
        value: {
            MAX_LINES: 3, // maximum number of lines allocated for channel names
            MAX_FONT: 20, // starting font
            MIN_FONT: 14, // won't go lower than this
            USABLE_AREA: 0.8 // persentage of usable width
        },
        writable: false
    });
}
