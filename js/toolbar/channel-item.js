function ChannelItem(data) {

    var _self = this;

    this.name = data["name"] || "";
    this.contrast = data["contrast"] || 0;
    this.brightness = data["brightness"] || 0;
    this.gamma = data["gamma"] || "";
    this.saturation = data["saturation"] || 100;
    if (data["hue"] >= 0) {
      this.hue = data["hue"]
    } else {
      this.hue = null;
    }

    this.showGreyscale = data["showGreyscale"] || false;

    this.osdItemId = data["osdItemId"];
    this.parent = data.parent || null;
    this.isDisplay = (typeof data["isDisplay"] === "boolean") ? data["isDisplay"] : true;
    this.isExpand = (typeof data["isDisplay"] === "boolean") ? data["isDisplay"] : true;
    this.elem = null;

    this.originalSettings = {
        "contrast": this.contrast,
        "brightness": this.brightness,
        "gamma": this.gamma,
        "saturation": this.saturation,
        "hue": this.hue,
        "showGreyscale": this.showGreyscale,
        "isDisplay": this.isDisplay,
        "isExpand": this.isExpand
    };

    this._minMaxValues = {
        contrast: {
            MIN: -100,
            MAX: 100
        },
        brightness: {
            MIN: -100,
            MAX: 100
        },
        gamma: {
            MIN: 0,
            MAX: 3
        },
        hue: {
            MIN: 0,
            MAX: 360
        }
    };

    this.getIconClass = function(type){
        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'fa fa-eye' : 'fa fa-eye-slash';
            case "expandPanel":
                return (this.isExpand) ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
        }
    }

    this.getTooltip = function(type){
        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'Hide the channel' : 'Display the channel';
            case "toggleGreyscale":
                return (this.showGreyscale) ? "Apply hue and saturation" : "Display greyscale image";
        }
    }


    // Click to expand/collapse the setting
    this.onClickToggleExpand = function(event, expand){
        if (typeof expand === "boolean") {
            _self.isExpand = expand;
        } else {
            _self.isExpand = !_self.isExpand;
        }
        _self.elem.querySelector(".setting").className = _self.isExpand ? "setting" : "setting collapse";
        _self.elem.querySelector(".toggleSetting").innerHTML = "<i class='"+_self.getIconClass("expandPanel")+"'></i>";
    };

    // Click to toggle overlay visibility
    this.onClickToggleDisplay = function(event, isDisplay){
        if (typeof isDisplay === "boolean") {
            _self.isDisplay = isDisplay;
        } else {
            _self.isDisplay = !_self.isDisplay;
        }
        _self.parent.dispatchEvent('changeOsdItemVisibility', {
            osdItemId : _self.osdItemId,
            isDisplay : _self.isDisplay
        })
        _self.elem.querySelector(".toggleVisibility").innerHTML = "<i class='"+_self.getIconClass("toggleDisplay")+"'></i>";
        _self.elem.querySelector(".toggleVisibility")._tippy.setContent(_self.getTooltip('toggleDisplay'));
        event.stopPropagation();
    };

    /**
     * make sure the hue and saturation control attributes are properly set and it's displayed properly
     * if we switch to greyscale: saturation should show 0, hue should show "Greyscale"
     * and vice versa
     */
    this._setHueSaturationControlState = function () {
        var displayedHue = _self.hue,
            displayedSat = _self.saturation,
            hueEl = _self.elem.querySelector(".sliderContainer[data-type='hue']"),
            saturationEl = _self.elem.querySelector(".sliderContainer[data-type='saturation']");

        // show the greyscale image
        if (_self.showGreyscale) {
            displayedHue = "Greyscale";
            displayedSat = 0; // this will just change the displayed value
        }

        // change the displayed value
        if (displayedHue != "Greyscale") {
            hueEl.querySelector("input.slider").value = displayedHue;
            hueEl.querySelector("input.number").value = displayedHue;
        }

        // change the displayed value of saturation
        if (displayedSat != null) {
            saturationEl.querySelector("input.number").value = displayedSat;
            saturationEl.querySelector("input.slider").value = displayedSat;
        }

        //change the active classes
        hueEl.querySelector("input.number").className = _self.showGreyscale ? "number" : "number active";

        var hueControl = hueEl.querySelector(".hue-container");
        hueControl.querySelector('.slider').className = _self.showGreyscale ? "slider" : "slider active";

        var hueControlBtn = hueControl.querySelector('.toggle-greyscale');
        hueControlBtn.className = !_self.showGreyscale ? "toggle-greyscale" : "toggle-greyscale active";
        hueControlBtn._tippy.setContent(_self.getTooltip('toggleGreyscale'))
    };

    this.onClickToggleGreyscale = function (event, showGreyscale) {
        if (typeof showGreyscale === "boolean") {
            _self.showGreyscale = showGreyscale;
        } else {
            _self.showGreyscale = !_self.showGreyscale;
        }

        // make sure the controls are correctly displayed
        _self._setHueSaturationControlState();

        // set te proper value
        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            type : 'showGreyscale',
            value : _self.showGreyscale
        });

        event.stopPropagation();
    };

    // Change the slider value
    this.onChangeSliderValue = function(event){
        var target = event.target;

        var type = target.parentNode.parentNode.getAttribute("data-type"),
            value = +target.value;

        // only show the tooltip while users are interacting with it
        if (target._tippy) {
            target._tippy.hide();
        }

        var res = _self._setChannelColorSetting(type, value);

        if (res === false) {
            return;
        }

        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            type : type,
            value : value
        });
    };

    this.onValueChanged = function (event) {
        var target = event.target;

        var type = target.parentNode.parentNode.parentNode.getAttribute("data-type"),
            value = +target.value;

        // TODO validate the numbers
        var validate = _self._setChannelColorSetting(type, value, true);

        if (validate !== false) {
            _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
                id: _self.osdItemId,
                type : type,
                value : value
            });
        }
    }

    this.changeSliderTooltipValue = function (event) {
        var target = event.target;

        var type = target.parentNode.parentNode.getAttribute("data-type"),
            value = +target.value;

        if (target._tippy) {
            target._tippy.setContent(value);
            // target._tippy.setProps({offset: []})
            target._tippy.show();
        }
    };

    // make sure the corresponding attribute and UI element are updated
    this._setChannelColorSetting = function (type, value, validate)  {
        var el = _self.elem.querySelector(".sliderContainer[data-type='" + type + "']"),
            validator = _self._minMaxValues[type],
            numberVal = Number(value);

        // validate the given value
        if (validate  && (isNaN(value) || numberVal < validator.MIN || numberVal > validator.MAX)) {
            _self._setChannelColorSetting(type, _self[type]);
            return false;
        }
        switch(type){
            case "contrast":
            case "brightness":
            case "gamma":
                _self[type] = value;
                // make sure both slider and number are showing the value
                el.querySelector("input.slider").value = value;
                el.querySelector("input.number").value = value;
                break;
            case "saturation":
            case "hue":
                _self[type] = value;

                // make sure we're not using greyscale
                _self.showGreyscale = false;

                // make sure the value is displayed
                _self._setHueSaturationControlState();
                break;
            case "showGreyscale":
                _self.showGreyscale = value;
                _self._setHueSaturationControlState();
                break;
        };

        return true;
    }

    this.resetChannelSettings = function (event) {
        var og = _self.originalSettings;

        // expand
        if (_self.isExpand != og.isExpand) {
            _self.onClickToggleExpand(event, og.isExpand);
        }

        // display
        if (_self.isDisplay != og.isDisplay) {
            _self.onClickToggleDisplay(event, og.isExpand);
        }

        // color settings
        var attrs = ["contrast", "brightness", "gamma"];
        // if hue control is missing, we shouldn't update the settings either
        if (og.hue != null) {
            attrs.push("showGreyscale", "hue", "saturation");
        }
        var newSettings = {};
        attrs.forEach(function (attrName) {
            if (og[attrName] == null) return;

            newSettings[attrName] = og[attrName];

            // make sure the change is reflected in the UI
            _self._setChannelColorSetting(attrName, og[attrName]);
        })

        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            settings: newSettings
        })

        event.stopPropagation();
    };

    this.render = function(){

        var channeElem = document.createElement("div");
        channeElem.setAttribute("class", "channelItem");
        channeElem.setAttribute("item-id", this.osdItemId);

        channeElem.innerHTML = [
            "<div class='channelRow'>",
                "<span class='toggleSetting' data-type='setting'><i class='"+this.getIconClass("expandPanel")+"'></i></span>",
                "<span class='channelName'>"+ this.name +"</span>",
                "<span class=channel-control-button-container''>",
                    "<span class='channel-control-btn reset-settings' data-tippy-content='Reset the channel settings'><i class='fas fa-undo'></i></span>",
                    "<span class='channel-control-btn toggleVisibility' data-tippy-content='" + this.getTooltip('toggleDisplay') + "' data-type='visibility'><i class='"+this.getIconClass("toggleDisplay")+"'></i></span>",
                "</span>",
            "</div>",
            "<div class='setting" + (!this.isExpand ? " collapse" : "") + "'>",
                "<span class='sliderContainer' data-type='contrast'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Contrast",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "Use the slider or input to change color contrast. <br>",
                                    "Acceptable values: Numbers from <strong>-100</strong> to <strong>100</strong>. <br>",
                                    "Default value: <strong>0</strong> <br>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='number active' value=" + this.contrast + ">",
                        "</span>",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' data-tippy-placement='top' data-tippy-content='" + this.contrast + "' min='-100' max='100' step='1' value='"+this.contrast+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='brightness'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Brightness",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "Use the slider or input to change brightness of image. <br>",
                                    "Acceptable values: Integers from <strong>-100</strong> to <strong>100</strong>. <br>",
                                    "Default value: <strong>0</strong> <br>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='number active' value=" + this.brightness + ">",
                        "</span>",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' data-tippy-placement='top' data-tippy-content='" + this.brightness + "' min='-100' max='100' step='1' value='"+this.brightness+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='gamma'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Gamma",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "Use the slider or input to apply Gamma filter. <br>",
                                    "Acceptable values: Numbers from <strong>0</strong> to <strong>3</strong>. <br>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='number active' value=" + this.gamma + ">",
                        "</span>",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' data-tippy-placement='top' data-tippy-content='" + this.gamma + "' min='0' max='3' step='0.01' value='"+this.gamma+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='saturation'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Saturation",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "Use the slider or input to modify the saturation. <br>",
                                    "Acceptable values: Numbers from <strong>0</strong> to <strong>100</strong>. <br>",
                                    "Default value: <strong>100</strong> <br>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='number active' value=" + this.saturation + ">",
                        "</span>",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' data-tippy-placement='top' data-tippy-content='" + this.saturation + "' min='0' max='100' step='1' value='"+this.saturation+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='hue'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Hue",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "Use the slider or input to apply color. <br>",
                                    "Acceptable values: Numbers from <strong>0</strong> to <strong>360</strong>. <br>",
                                    "<br>",
                                    "Use the checkbox to switch between Greyscale and color.",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='number " + (!this.showGreyscale ? "active" : "") + "' value=" + this.hue + ">",
                            "<span class='greyscale'>Greyscale</span>",
                        "</span>",
                    "</span>",
                    "<span class='hue-container' data-type='hue'>",
                        "<span class='slider-wrapper'>",
                            "<input type='range' class='slider " + (!this.showGreyscale ? "active" : "") + "' data-tippy-placement='top' data-tippy-content='" + this.hue + "' min='0' max='360' step='1' value='"+this.hue+"'>",
                        "</span>",
                        "<span data-tippy-placement='right' data-tippy-content='" + _self.getTooltip('toggleGreyscale') + "' class='toggle-greyscale " + (this.showGreyscale ? "active" : "") + "'></span>",
                    "</span>",
                "</span>",
            "</div>",
        ].join("");

        if(this.hue == null){
            channeElem.querySelector(".sliderContainer[data-type='hue']").remove();
            channeElem.querySelector(".sliderContainer[data-type='saturation']").remove();
        }
        this.elem = channeElem;

        // Binding events

        // reset button
        this.elem.querySelectorAll(".channelRow .reset-settings").forEach(function(elem){
            elem.addEventListener('click', this.resetChannelSettings);
        }.bind(this));

        //
        this.elem.querySelectorAll(".hue-container .toggle-greyscale").forEach(function(elem){
            elem.addEventListener('click', this.onClickToggleGreyscale);
        }.bind(this));

        // Change the visibility of Openseadragon items
        this.elem.querySelectorAll(".channelRow .toggleVisibility").forEach(function(elem){
            elem.addEventListener('click', this.onClickToggleDisplay);
        }.bind(this));

        // Open/Close the setting panel
        this.elem.querySelectorAll(".channelRow").forEach(function(elem){
            elem.addEventListener('click', this.onClickToggleExpand);
        }.bind(this));

        // change the input
        var numberInputChangedTimer;
        this.elem.querySelectorAll("input.number").forEach(function(elem){
            // when enter is pressed
            elem.addEventListener('change', function (event) {
                clearTimeout(numberInputChangedTimer);
                _self.onValueChanged(event);
            });

            // submit after 2 second delay
            elem.addEventListener('input', function (event) {
                clearTimeout(numberInputChangedTimer);
                numberInputChangedTimer = setTimeout(function () {
                    _self.onValueChanged(event);
                }, 2000);
            });
        }.bind(this));

        // Change the slider value
        this.elem.querySelectorAll("input.slider").forEach(function(elem){
            elem.addEventListener('change', this.onChangeSliderValue);

            elem.addEventListener('input', this.changeSliderTooltipValue);
        }.bind(this));
    }
}
