function ChannelItem(data){

    var _self = this;

    this.name = data["name"] || "";
    this.contrast = data["contrast"] || "";
    this.brightness = data["brightness"] || 0;
    this.gamma = data["gamma"] || "";
    this.hue = data["hue"] || null;
    this.opacity = data["opacity"] || "";
    this.osdItemId = data["osdItemId"];
    this.parent = data.parent || null;
    this.isDisplay = true;
    this.isExpand = true;
    this.elem = null;

    // Click to expand/collapse the setting
    this.onClickToggleExpand = function(){
        _self.isExpand = !_self.isExpand;
        _self.elem.querySelector(".setting").className = _self.isExpand ? "setting" : "setting collapse";
        this.querySelector(".toggleSetting").innerHTML = "<i class='"+_self.getExpandIconClass()+"'></i>";
    };

    // Click to toggle overlay visibility
    this.onClickToggleDisplay = function(event){
        _self.isDisplay = !_self.isDisplay;
        _self.parent.dispatchEvent('ChangeOsdItemVisibility', {
            osdItemId : _self.osdItemId,
            isDisplay : _self.isDisplay
        })
        this.innerHTML = "<i class='"+_self.getDisplayIconClass()+"'></i>";
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
                _self.hue = value;
                _self.elem.querySelector(".sliderContainer[data-type='hue'] .attrRow .value").innerText = value;
                break;
        };

        _self.parent.dispatchEvent('ChangeOsdItemChannelSetting', {
            id: _self.osdItemId,
            type : type,
            value : value
        })
    };
}

ChannelItem.prototype.getDisplayIconClass = function(){
    if(this.isDisplay){
        return 'fa fa-eye';
    }
    else{
        return 'fa fa-eye-slash';
    }
}

ChannelItem.prototype.getExpandIconClass = function(){
    if(this.isExpand){
        return 'fa fa-caret-down';
    }
    else{
        return 'fa fa-caret-up';
    }
}

ChannelItem.prototype.getContrastText = function(){
    return (this.contrast * 100).toFixed(0);
}


ChannelItem.prototype.render = function(){

    var channeElem = document.createElement("div");
    channeElem.setAttribute("class", "channelItem");
    channeElem.setAttribute("item-id", this.osdItemId);

    channeElem.innerHTML = [
        "<div class='channelRow'>",
            "<span class='toggleSetting' data-type='setting'><i class='"+this.getExpandIconClass()+"'></i></span>",
            "<span class='channelName'>"+ this.name +"</span>",
            "<span class='toggleVisibility' data-type='visibility'><i class='"+this.getDisplayIconClass()+"'></i></span>",
        "</div>",
        "<div class='setting expand'>",
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
                    "<span class='value'>"+ this.hue +"</span>",
                "</span>",
                "<input type='range' class='slider' min='0' max='360' step='1' value='"+this.hue+"'>",
            "</span>",
        "</div>",
    ].join("");

    if(this.hue == null){
        channeElem.querySelector(".sliderContainer[data-type='hue']").remove();
    }
    this.elem = channeElem;

    // Binding events

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

