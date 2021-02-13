function ChannelItem(data){

    var _self = this;

    this.name = data["name"] || "";
    this.contrast = data["contrast"] || 1;
    this.brightness = data["brightness"] || 0;
    this.gamma = data["gamma"] || "";
    if (data["hue"] >= 0) {
      this.hue = data["hue"]
    } else {
      this.hue = null;
    }

    this.deactivateHue = data["deactivateHue"] || false;

    this.osdItemId = data["osdItemId"];
    this.parent = data.parent || null;
    this.isDisplay = (typeof data["isDisplay"] === "boolean") ? data["isDisplay"] : true;
    this.isExpand = (typeof data["isDisplay"] === "boolean") ? data["isDisplay"] : true;
    this.elem = null;

    this.originalSettings = {
        "contrast": this.contrast,
        "brightness": this.brightness,
        "gamma": this.gamma,
        "hue": this.hue,
        "deactivateHue": this.deactivateHue,
        "isDisplay": this.isDisplay,
        "isExpand": this.isExpand
    };

    this.getIconClass = function(type){
        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'fa fa-eye' : 'fa fa-eye-slash';
            case "expandPanel":
                return (this.isExpand) ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
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
        event.stopPropagation();
    };

    /**
     * make sure the hue control attributes are properly set and it's displayed properly
     * @param {String|Number=} newVal - the new value that should be used.
     */
    this._setHueControlState = function (newVal) {
        var val = 0;

        // set the value to something new
        if (newVal != null) {
            _self.deactivateHue = false;
            val = newVal;
        }
        // deactivate the hue control
        else if (_self.deactivateHue) {
            val = "Greyscale";
            _self._previousHue = _self.hue;
        }
        // activate the hue control and use the previous value if available
        else if (_self._previousHue != null) {
            val = _self._previousHue;
        }

        // change the displayed value
        _self.hue = val;
        _self.elem.querySelector(".sliderContainer[data-type='hue'] .attrRow .value").innerText = val;
        // _self.elem.querySelector(".sliderContainer[data-type='hue'] .attrRow .value").value = val;

        //change the active classes
        var hueControl = _self.elem.querySelector(".sliderContainer[data-type='hue'] .hue-container");
        hueControl.querySelector('.slider').className = _self.deactivateHue ? "slider" : "slider active";

        var hueControlBtn = hueControl.querySelector('.deactivate-hue');
        hueControlBtn.className = !_self.deactivateHue ? "deactivate-hue" : "deactivate-hue active";
        hueControlBtn.setAttribute('title', (_self.deactivateHue ? "Apply hue adjustment" : "Use greyscale"));
    };

    this.onClickDeactivateHue = function (event, deactivateHue) {
        if (typeof deactivateHue === "boolean") {
            _self.deactivateHue = deactivateHue;
        } else {
            _self.deactivateHue = !_self.deactivateHue;
        }

        // make sure the controls are correctly displayed
        _self._setHueControlState();

        // set te proper value
        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            type : 'deactivateHue',
            value : _self.deactivateHue
        });

        event.stopPropagation();
    };

    // Change the slider value
    this.onChangeSliderValue = function(){
        var type = this.parentNode.parentNode.getAttribute("data-type"),
            value = +this.value;

        _self._setChannelColorSetting(type, value);

        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            type : type,
            value : value
        })
    };

    // make sure the corresponding attribute and UI element are updated
    this._setChannelColorSetting = function (type, value)  {
        switch(type){
            case "contrast":
            case "brightness":
            case "gamma":
                _self[type] = value;
                // make sure slider is showing the value
                _self.elem.querySelector(".sliderContainer[data-type='" + type + "'] input").value = value;
                // make sure the value is displayed
                _self.elem.querySelector(".sliderContainer[data-type='" + type + "'] .attrRow .value").innerText = value;
                // _self.elem.querySelector(".sliderContainer[data-type='" + type + "'] .attrRow .value").value = value;
                break;
            case "hue":
                // make sure slider is showing the value
                _self.elem.querySelector(".sliderContainer[data-type='hue'] input").value = value;
                // make sure the value is displayed
                _self._setHueControlState(value);
                break;
            case "deactivateHue":
                _self.deactivateHue = value;
                _self._setHueControlState();
                break;
        };
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
            attrs.push("deactivateHue", "hue");
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
                    "<span class='channel-control-btn reset-settings' title='Reset the channel settings'><i class='fas fa-undo'></i></span>",
                    "<span class='channel-control-btn toggleVisibility' data-type='visibility'><i class='"+this.getIconClass("toggleDisplay")+"'></i></span>",
                "</span>",
            "</div>",
            "<div class='setting" + (!this.isExpand ? " collapse" : "") + "'>",
                "<span class='sliderContainer' data-type='contrast'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Contrast</span>",
                        "<span class='value'>"+ this.contrast +"</span>",
                        // "<input class='value' value=" + this.contrast + ">",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' min='0' max='10' step='0.1' value='"+this.contrast+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='brightness'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Brightness</span>",
                        "<span class='value'>"+ this.brightness +"</span>",
                        // "<input class='value' value=" + this.brightness + ">",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' min='-255' max='255' step='5' value='"+this.brightness+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='gamma'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Gamma</span>",
                        "<span class='value'>"+ this.gamma +"</span>",
                        // "<input class='value' value=" + this.gamma + ">",
                    "</span>",
                    "<span class='slider-wrapper'>",
                        "<input type='range' class='slider' min='0' max='3' step='0.125' value='"+this.gamma+"'>",
                    "</span>",
                "</span>",
                "<span class='sliderContainer' data-type='hue'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Hue</span>",
                        "<span class='value'>" + (this.deactivateHue ? "Greyscale" : this.hue) + "</span>",
                    "</span>",
                    "<span class='hue-container' data-type='hue'>",
                        "<span class='slider-wrapper'>",
                            "<input type='range' class='slider " + (!this.deactivateHue ? "active" : "") + "' min='0' max='360' step='1' value='"+this.hue+"'>",
                        "</span>",
                        "<span title='" + (this.deactivateHue ? "Apply hue adjustment" : "Use greyscale") + "' class='deactivate-hue " + (this.deactivateHue ? "active" : "") + "'></span>",
                    "</span>",
                "</span>",
            "</div>",
        ].join("");

        if(this.hue == null){
            channeElem.querySelector(".sliderContainer[data-type='hue']").remove();
        }
        this.elem = channeElem;

        // Binding events

        // reset button
        this.elem.querySelectorAll(".channelRow .reset-settings").forEach(function(elem){
            elem.addEventListener('click', this.resetChannelSettings);
        }.bind(this));

        //
        this.elem.querySelectorAll(".hue-container .deactivate-hue").forEach(function(elem){
            elem.addEventListener('click', this.onClickDeactivateHue);
        }.bind(this));

        // Change the visibility of Openseadragon items
        this.elem.querySelectorAll(".channelRow .toggleVisibility").forEach(function(elem){
            elem.addEventListener('click', this.onClickToggleDisplay);
        }.bind(this));

        // Open/Close the setting panel
        this.elem.querySelectorAll(".channelRow").forEach(function(elem){
            elem.addEventListener('click', this.onClickToggleExpand);
        }.bind(this));

        // Change the slider value
        this.elem.querySelectorAll("input.slider").forEach(function(elem){
            elem.addEventListener('change', this.onChangeSliderValue);
        }.bind(this));
    }
}
