function ChannelItem(data){

    var _self = this;

    this.name = data["name"] || "";
    this.contrast = data["contrast"] || "";
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

    this.getIconClass = function(type){
        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'fa fa-eye' : 'fa fa-eye-slash';
            case "expandPanel":
                return (this.isExpand) ? 'fa fa-caret-down' : 'fa fa-caret-up';
        }
    }

    this.getContrastText = function(){
        return (this.contrast * 100).toFixed(0);
    }

    // Click to expand/collapse the setting
    this.onClickToggleExpand = function(expand){
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

        //change the active classes
        var hueControl = _self.elem.querySelector(".sliderContainer[data-type='hue'] .hue-container");
        hueControl.querySelector('.slider').className = _self.deactivateHue ? "slider" : "slider active";

        var hueControlBtn = hueControl.querySelector('.deactivate-hue');
        hueControlBtn.className = !_self.deactivateHue ? "deactivate-hue" : "deactivate-hue active";
        hueControlBtn.setAttribute('title', (_self.deactivateHue ? "Apply hue adjustment" : "Use greyscale"));
    };

    this.onClickDeactivateHue = function (event) {
        _self.deactivateHue = !_self.deactivateHue;

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
        var type = this.parentNode.getAttribute("data-type"),
            value = +this.value;

        switch(type){
            case "contrast":
                _self.contrast = value;
                _self.elem.querySelector(".sliderContainer[data-type='contrast'] .attrRow .value").innerText = _self.getContrastText();
                break;
            case "brightness":
                _self.brightness = value;
                _self.elem.querySelector(".sliderContainer[data-type='brightness'] .attrRow .value").innerText = value;
                break;
            case "gamma":
                _self.gamma = value;
                _self.elem.querySelector(".sliderContainer[data-type='gamma'] .attrRow .value").innerText = value;
                break;
            case "hue":
                _self._setHueControlState(value);
                break;
        };

        _self.parent.dispatchEvent('changeOsdItemChannelSetting', {
            id: _self.osdItemId,
            type : type,
            value : value
        })
    };

    this.render = function(){

        var channeElem = document.createElement("div");
        channeElem.setAttribute("class", "channelItem");
        channeElem.setAttribute("item-id", this.osdItemId);

        channeElem.innerHTML = [
            "<div class='channelRow'>",
                "<span class='toggleSetting' data-type='setting'><i class='"+this.getIconClass("expandPanel")+"'></i></span>",
                "<span class='channelName'>"+ this.name +"</span>",
                "<span class='toggleVisibility' data-type='visibility'><i class='"+this.getIconClass("toggleDisplay")+"'></i></span>",
            "</div>",
            "<div class='setting" + (!this.isExpand ? " collapse" : "") + "'>",
                "<span class='sliderContainer' data-type='contrast'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Contrast</span>",
                        "<span class='value'>"+ this.getContrastText() +"</span>",
                    "</span>",
                    "<input type='range' class='slider' min='0' max='1' step='0.05' value='"+this.contrast+"'>",
                "</span>",
                "<span class='sliderContainer' data-type='brightness'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Brightness</span>",
                        "<span class='value'>"+ this.brightness +"</span>",
                    "</span>",
                    "<input type='range' class='slider' min='-255' max='255' step='5' value='"+this.brightness+"'>",
                "</span>",
                "<span class='sliderContainer' data-type='gamma'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Gamma</span>",
                        "<span class='value'>"+ this.gamma +"</span>",
                    "</span>",
                    "<input type='range' class='slider' min='0' max='3' step='0.125' value='"+this.gamma+"'>",
                "</span>",
                "<span class='sliderContainer' data-type='hue'>",
                    "<span class='attrRow'>",
                        "<span class='name'>Hue</span>",
                        "<span class='value'>" + (this.deactivateHue ? "Greyscale" : this.hue) + "</span>",
                    "</span>",
                    "<span class='hue-container' data-type='hue'>",
                        "<input type='range' class='slider " + (!this.deactivateHue ? "active" : "") + "' min='0' max='360' step='1' value='"+this.hue+"'>",
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
