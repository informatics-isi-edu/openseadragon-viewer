function ChannelItem(data) {

    var _self = this;

    this.number = data["number"];
    this.name = data["name"];
    this.blackLevel = data["blackLevel"];
    this.whiteLevel = data["whiteLevel"];
    this.gamma = data["gamma"];
    this.saturation = data["saturation"];
    if (data["hue"] >= 0) {
      this.hue = data["hue"]
    } else {
      this.hue = null;
    }

    this.displayGreyscale = data["displayGreyscale"] || false;

    this.osdItemId = data["osdItemId"];
    this.parent = data.parent || null;
    this.isDisplay = (typeof data["isDisplay"] === "boolean") ? data["isDisplay"] : true;
    this.isExpand = (typeof data["isDisplay"] === "boolean") ? data["isDisplay"] : true;
    this.acls = (typeof data["acls"] === "object" && data["acls"] != null) ? data["acls"] : {};

    this.elem = null;

    this.originalSettings = {
        "blackLevel": this.blackLevel,
        "whiteLevel": this.whiteLevel,
        "gamma": this.gamma,
        "saturation": this.saturation,
        "hue": this.hue,
        "displayGreyscale": this.displayGreyscale,
        "isDisplay": this.isDisplay,
        "isExpand": this.isExpand
    };

    this._validators = {
        blackLevel: {
            MIN: 0,
            MAX: 255,
            IS_INT: true,
            FN: function (val) {
                return _self.whiteLevel - 5 > val;
            }
        },
        whiteLevel: {
            MIN: 0,
            MAX: 255,
            IS_INT: true,
            FN: function (val) {
                return _self.blackLevel + 5 < val;
            }
        },
        saturation: {
            min: 0,
            max: 100
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

    this._tooltipSettings = {
        default: {
            addPlusSign: true,
            suffix: ""
        },
        saturation: {
            addPlusSign: false,
            suffix: "%"
        },
        hue: {
            addPlusSign: false,
            suffix: ""
        },
        gamma: {
            addPlusSign: false,
            suffix: ""
        }
    }

    this.getIconClass = function(type){
        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'fa fa-eye' : 'fa fa-eye-slash';
            case "expandPanel":
                return (this.isExpand) ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
        }
    }

    this.getButtonTooltip = function(type){
        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'Hide this channel' : 'Display this channel';
            case "toggleGreyscale":
                return (this.displayGreyscale) ? "Apply hue and saturation" : "Display greyscale image";
        }
    }

    this.getSliderTooltip = function (type, value) {
        var settings = (type in _self._tooltipSettings) ? _self._tooltipSettings[type] : _self._tooltipSettings.default;

        if (settings.addPlusSign && value >= 0) {
            value = "+" + value;
        }

        value += settings.suffix;
        return value;
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
        _self.elem.querySelector(".toggleVisibility")._tippy.setContent(_self.getButtonTooltip('toggleDisplay'));
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
        if (_self.displayGreyscale) {
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
        hueEl.querySelector("input.number").className = _self.displayGreyscale ? "channel-input number" : "channel-input number active";

        var hueControl = hueEl.querySelector(".hue-container");
        hueControl.querySelector('.slider').className = _self.displayGreyscale ? "slider" : "slider active";

        var hueControlBtn = hueControl.querySelector('.toggle-greyscale');
        hueControlBtn.className = !_self.displayGreyscale ? "toggle-greyscale" : "toggle-greyscale active";
        hueControlBtn._tippy.setContent(_self.getButtonTooltip('toggleGreyscale'))
    };

    this.onClickToggleGreyscale = function (event, displayGreyscale) {
        if (typeof displayGreyscale === "boolean") {
            _self.displayGreyscale = displayGreyscale;
        } else {
            _self.displayGreyscale = !_self.displayGreyscale;
        }

        // make sure the controls are correctly displayed
        _self._setHueSaturationControlState();

        // set te proper value
        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            type : 'displayGreyscale',
            value : _self.displayGreyscale
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

        // don't do anything is value is the same
        if (_self[type] == value) return;

        var res = _self._setChannelColorSetting(type, value, false, false);

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

        // don't do anything if the value is the same
        if (_self[type] == value) return;

        // TODO validate the numbers
        var validate = _self._setChannelColorSetting(type, value, true, true);

        if (validate !== false) {
            _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
                id: _self.osdItemId,
                type : type,
                value : value
            });
        }
    }

    this._setInitialSliderTooltip = function (elem) {
        var type = elem.parentNode.parentNode.getAttribute("data-type");
        tippy(elem, {content: _self.getSliderTooltip(type, _self[type])});
    }

    this.changeSliderTooltipValue = function (event) {
        var target = event.target;

        var type = target.parentNode.parentNode.getAttribute("data-type"),
            value = +target.value;

        if (target._tippy) {
            target._tippy.setContent(_self.getSliderTooltip(type, value));
            target._tippy.show();
        }
    };

    // make sure the corresponding attribute and UI element are updated
    this._setChannelColorSetting = function (type, value, validate, changeTooltip)  {
        var validator = _self._validators[type];

        // validate the given value
        if (validator && validate) {
            if (validator.IS_INT) {
                value = parseInt(value);
            }

            // min - max
            var numberVal = Number(value);
            var invalid = isNaN(value) || numberVal < validator.MIN || numberVal > validator.MAX;

            // fn
            if (invalid || (validator.FN && !validator.FN(value))) {
                invalid = true;
            }

            if (invalid) {
                _self._setChannelColorSetting(type, _self[type], value, false, changeTooltip);
                return false;
            }
        }

        // make sure the tooltip is correct
        var el = el = _self.elem.querySelector(".sliderContainer[data-type='" + type + "']"), slider;
        if (el) {
            slider = el.querySelector("input.slider");
            if (slider && slider._tippy && changeTooltip) {
                slider._tippy.setContent(_self.getSliderTooltip(type, value));
            }
        }

        switch(type){
            case "blackLevel":
            case "whiteLevel":
                var rangeMin = null, rangeMax = null;
                if (type == "whiteLevel") {
                    rangeMax = value;
                } else {
                    rangeMin = value;
                }

                _self[type] = value;

                // change the input value
                _self.elem.querySelector(".intensity-range-input[data-type='" + type + "']").value = value;

                // make sure the range is showing correct values
                _self.elem.querySelector(".intensity-range-slider").noUiSlider.set([rangeMin, rangeMax]);
                break;
            case "gamma":
                _self[type] = value;
                // make sure both slider and number are showing the value
                slider.value = value;
                el.querySelector("input.number").value = value;
                break;
            case "saturation":
            case "hue":
                _self[type] = value;

                // make sure we're not using greyscale
                _self.displayGreyscale = false;

                // make sure the value is displayed
                _self._setHueSaturationControlState();
                break;
            case "displayGreyscale":
                _self.displayGreyscale = value;
                _self._setHueSaturationControlState();
                break;
        };

        return true;
    }

    this.onIntensityRangeInputValueChanged = function (event) {
        var type = event.target.getAttribute("data-type"),
            value = +event.target.value;

        var validate = _self._setChannelColorSetting(type, value, true, true)

        if (validate !== false) {
            _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
                id: _self.osdItemId,
                type: type,
                value: value
            });
        }
    }

    this.resetChannelSettings = function (event) {
        event.stopPropagation();

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
        var attrs = ["blackLevel", "whiteLevel", "gamma"];
        // if hue control is missing, we shouldn't update the settings either
        if (og.hue != null) {
            attrs.push("displayGreyscale", "hue", "saturation");
        }
        var newSettings = {};
        attrs.forEach(function (attrName) {

            // only add the ones that have changed or have value
            if (og[attrName] == null || og[attrName] == _self[attrName]) return;

            newSettings[attrName] = og[attrName];

            // make sure the change is reflected in the UI
            _self._setChannelColorSetting(attrName, og[attrName], false, true);
        });

        // TODO take care of range min and range max

        // don't do anything if nothing has changed.
        if (Object.keys(newSettings).length === 0) return;

        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            settings: newSettings
        });
    };

    this.saveChannelSettings = function (event, dontDispatch) {
        event.stopPropagation();

        _self.showSpinner(true);

        // create the data that will be saved
        var configConst = window.OSDViewer.constants.CHANNEL_CONFIG,
            data = { channelNumber: _self.number, channelConfig: {}};
        data.channelConfig[configConst.BLACK_LEVEL] = _self.blackLevel;
        data.channelConfig[configConst.WHITE_LEVEL] = _self.whiteLevel;
        data.channelConfig[configConst.GAMMA] = _self.gamma;

        if (_self.hue != null) {
            data.channelConfig[configConst.SATURATION] = _self.saturation;
            data.channelConfig[configConst.HUE] = _self.hue;
            data.channelConfig[configConst.DISPLAY_GREYSCALE] = _self.displayGreyscale;
        }


        if (dontDispatch) {
            return data;
        } else {
            _self.parent.dispatchEvent('updateChannelConfig', [data]);
        }

    }

    this.saveChannelSettingsDone = function (success) {
        //hide the spinner
        _self.showSpinner(false);

        // change the original settings
        if (success) {
            ['blackLevel', 'whiteLevel', 'gamma', 'saturation', 'hue', 'displayGreyscale'].forEach(function (attr) {
                _self.originalSettings[attr] = _self[attr];
            });
        }
    }

    this.showSpinner = function (show) {
        // show/hide spinner
        var spinner = _self.elem.querySelector(".channel-setting-spinner-overlay");
        spinner.style.display = show ? "block" : "none";

        // change the save icon
        var btn = _self.elem.querySelector(".save-settings i");
        btn.className = show ? "glyphicon glyphicon-refresh glyphicon-refresh-animate" : "glyphicon glyphicon-saved";
    }

    this.render = function(){

        var channeElem = document.createElement("div");
        channeElem.setAttribute("class", "channelItem");
        channeElem.setAttribute("item-id", this.osdItemId);

        channeElem.innerHTML = [
            "<div class='channelRow'>",
                "<span class='toggleSetting' data-type='setting'><i class='"+this.getIconClass("expandPanel")+"'></i></span>",
                "<span class='channelName'>"+ this.name +"</span>",
                "<span class=channel-control-button-container''>",
                    "<span class='channel-control-btn save-settings' data-tippy-content='Save the current settings for this channel'><i class='glyphicon glyphicon-saved'></i></span>",
                    "<span class='channel-control-btn reset-settings' data-tippy-content='Reset settings of this channel'><i class='fas fa-undo'></i></span>",
                    "<span class='channel-control-btn toggleVisibility' data-tippy-content='" + this.getButtonTooltip('toggleDisplay') + "' data-type='visibility'><i class='"+this.getIconClass("toggleDisplay")+"'></i></span>",
                "</span>",
            "</div>",
            "<div class='setting" + (!this.isExpand ? " collapse" : "") + "'>",
                "<div class='channel-setting-spinner-overlay'>",
                    "<div class='channel-setting-spinner-container'>",
                        "<i class='glyphicon glyphicon-refresh glyphicon-refresh-animate'></i>",
                        "<div class='channel-settings-spinner-text loading-w-dots'>Saving</div>",
                    "</div>",
                "</div>",
                "<span class='sliderContainer' data-type='intensity-range'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Intensity range",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                   "<ul>",
                                       "<li>Choose black-level and white-level to define the displayed intenstiy range.</li>",
                                       "<li>All the values in between will be scaled linearly.</li>",
                                       "<li>Acceptable values: Integers from <strong>0</strong> to <strong>255</strong>.</li>",
                                   "</ul>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                    "</span>",
                    "<span class='intensity-range-container' data-type='intensity-range'>",
                        "<input data-type='blackLevel' class='channel-input active intensity-range-input intensity-range-input-min' value=" + this.blackLevel + ">",
                        "<div class='intensity-range-slider'></div>",
                        "<input data-type='whiteLevel' class='channel-input active intensity-range-input intensity-range-input-max' value=" + this.whiteLevel + ">",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='gamma'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Gamma",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "<ul>",
                                        "<li>Use the slider or input to apply Gamma filter. </li>",
                                        "<li>Acceptable values: Numbers from <strong>0</strong> to <strong>3</strong>. </li>",
                                    "</ul>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='channel-input number active' value=" + this.gamma + ">",
                        "</span>",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' data-tippy-placement='top' min='0' max='3' step='0.01' value='"+this.gamma+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='saturation'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Saturation",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "<ul>",
                                        "<li>Use the slider or input to modify the saturation. </li>",
                                        "<li>Acceptable values: Percentages from <strong>0%</strong> to <strong>100%</strong>. </li>",
                                        "<li>Default value: <strong>100</strong> </li>",
                                    "</ul>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='channel-input number active' value=" + this.saturation + ">",
                        "</span>",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' data-tippy-placement='top' min='0' max='100' step='0.5' value='"+this.saturation+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='hue'>",
                    "<span class='attrRow'>",
                        "<span class='name'>",
                            "Hue",
                            "<i class='fas fa-info-circle setting-info' ",
                                "data-tippy-placement='right'",
                                "data-tippy-content='",
                                    "<ul>",
                                        "<li>Use the slider or input to apply color. </li>",
                                        "<li>Acceptable values: Numbers from <strong>0</strong> to <strong>360</strong>.</li>",
                                        "<li>Use the checkbox to switch between Greyscale and color.</li>",
                                    "</ul>",
                                "'",
                                " >",
                            "</i>",
                        "</span>",
                        "<span class='value'>",
                            "<input class='channel-input number " + (!this.displayGreyscale ? "active" : "") + "' value=" + this.hue + ">",
                            "<span class='greyscale'>Greyscale</span>",
                        "</span>",
                    "</span>",
                    "<span class='hue-container' data-type='hue'>",
                        "<span class='slider-wrapper'>",
                            "<input type='range' class='slider " + (!this.displayGreyscale ? "active" : "") + "' data-tippy-placement='top' data-tippy-content='" + _self.getSliderTooltip("hue", this.hue) + "' min='0' max='360' step='1' value='"+this.hue+"'>",
                        "</span>",
                        "<span data-tippy-placement='right' data-tippy-content='" + _self.getButtonTooltip('toggleGreyscale') + "' class='toggle-greyscale " + (this.displayGreyscale ? "active" : "") + "'></span>",
                    "</span>",
                "</span>",
            "</div>",
        ].join("");

        if(this.hue == null){
            channeElem.querySelector(".sliderContainer[data-type='hue']").remove();
            channeElem.querySelector(".sliderContainer[data-type='saturation']").remove();
            channeElem.querySelector(".setting").classList.add("no-hue");
        }

        channeElem.querySelector(".save-settings").style.display = this.acls.canUpdateConfig ? "display-inline" : "none";


        this.elem = channeElem;

        // Binding events
        this.elem.querySelectorAll(".channelRow .save-settings").forEach(function(elem){
                elem.addEventListener('click', this.saveChannelSettings);
    }.bind(this));

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

        // color range events
        this.elem.querySelectorAll(".intensity-range-slider").forEach(function (elem) {
            noUiSlider.create(elem, {
                start: [_self.blackLevel, _self.whiteLevel],
                connect: true,
                tooltips: true,
                step: 1,
                margin: 5,
                format: {
                    from: function(value) {
                        return parseInt(value);
                    },
                    to: function(value) {
                        return parseInt(value);
                    }
                },
                range: {
                    'min': [0],
                    'max': [255]
                }
            });

            elem.noUiSlider.on('change', function (values, handle) {
                var value = values[handle], type;
                if (handle == 0) {
                    type = "blackLevel";
                    _self.elem.querySelector(".intensity-range-input-min").value = value;
                } else {
                    type = "whiteLevel";
                    _self.elem.querySelector(".intensity-range-input-max").value = value;
                }

                _self[type] = value;
                _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
                    id: _self.osdItemId,
                    type: type,
                    value: +value
                });
            });
        });

        // color range inputs
        var colorRangeNumberInputChangedTimer;
        this.elem.querySelectorAll(".intensity-range-input").forEach(function(elem){
            // when enter is pressed
            elem.addEventListener('change', function (event) {
                clearTimeout(colorRangeNumberInputChangedTimer);
                _self.onIntensityRangeInputValueChanged(event);
            });

            // submit after 2 second delay
            elem.addEventListener('input', function (event) {
                clearTimeout(colorRangeNumberInputChangedTimer);
                colorRangeNumberInputChangedTimer = setTimeout(function () {
                    _self.onIntensityRangeInputValueChanged(event);
                }, 2000);
            });
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
            // listener for the value
            elem.addEventListener('change', this.onChangeSliderValue);

            // tooltip value
            this._setInitialSliderTooltip(elem);
            elem.addEventListener('input', this.changeSliderTooltipValue);
        }.bind(this));
    };
}
