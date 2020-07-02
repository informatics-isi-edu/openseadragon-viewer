function Base(attrs){
    attrs = attrs ? attrs : {};
    var _self = this;
    this.parent = attrs.parent;
    this._attrs = {
        "annotation-id" : attrs["annotation-id"] || -1,
        "tag" : attrs["tag"] || "",
        "fill" : attrs["fill"] || "none",
        "stroke" :  attrs["stroke"] || "",
        "stroke-width" : attrs["stroke-width"] || "",
        "style" : ""
    }

    this.onClickToSelectAnnotation = function(){
        _self.dispatchEvent("onClickChangeSelectingAnnotation");
    };

    this.onMouseoverShowTooltip = function(){

        _self.dispatchEvent("onMouseoverShowTooltip", {
            x : d3.event.pageX,
            y : d3.event.pageY
        })
    };

    this.onMousemoveShowTooltip = function(){
        _self.dispatchEvent("onMousemoveShowTooltip", {
            x : d3.event.pageX,
            y : d3.event.pageY
        })
    };

    this.onMouseoutHideTooltip = function(){
        _self.dispatchEvent("onMouseoutHideTooltip");
    };
}

Base.prototype.dispatchEvent = function(type, data){
    this.parent.dispatchEvent(type, data);
}

Base.prototype.getAttributes = function(attrs){
    var attr,
        resAttr = {};

    if(attrs){
        for(attr in attrs){
            if(attr in this._attrs){
                resAttr[attr] = _attrs[attr];
            }
        }
        return resAttr;
    }
    else{
        return this._attrs;
    }
}

Base.prototype.highlight = function(highlightAttrs){

    for(var attr in highlightAttrs){
        this.svg.attr(attr, highlightAttrs[attr]);
    }
}

Base.prototype.renderSVG = function(){
    
    var attr,
        value,
        strokeScale = this.parent.getStrokeScale() || 1;

    if(this.svg == null){ 
        this.svg = this.parent.svg
            .append(this._attrs['tag'])
            .attr("class", "annotation")
        
        this.svg.on("mouseover", this.onMouseoverShowTooltip)
            .on("mousemove", this.onMousemoveShowTooltip)
            .on("mouseout", this.onMouseoutHideTooltip)
            .on('click', this.onClickToSelectAnnotation);
    }

    for(attr in this._attrs){
        value = this._attrs[attr];
        
        switch(attr){
            case "tag":
                break;
            case "stroke-width":
                value = parseInt(value) || 1;
                this.svg.attr(attr, value * strokeScale);
                break;
            default:
                this.svg.attr(attr, value);
                break;
        }
    }
}

Base.prototype.setAttributesByJSON = function(attrs){
    var attr,
        value;

    for(attr in attrs){
        value = attrs[attr];        
        if(attr in this._attrs){
            this._attrs[attr] = value;
        }
    }
}

Base.prototype.setAttributesBySVG = function(elem){
    
    var attr,
        value,
        styleArr;

    for(attr in this._attrs){
        value = elem.getAttribute(attr);
        if(value != null){
            switch(attr){
                case "style":
                    value = value.replace(/\s/g, '');
                    styleArr = value.split(";");
                    for(var i = 0; i < styleArr.length; i++){
                        var attrName = styleArr[i].split(":")[0];
                        var attrValue = styleArr[i].split(":")[1];
                        this._attrs[attrName] = attrValue;
                    }
                    break;
                default:
                    this._attrs[attr] = value;
                    break;
            }
            
        }
    }
}

Base.prototype.unHighlight = function(){
    var strokeScale = this.parent.getStrokeScale() || 1;
    var strokeWidth = parseInt(this._attrs["stroke-width"]) || 1;

    this.svg
        .attr("fill", this._attrs["fill"] || "")
        .attr("stroke", this._attrs["stroke"] || "")
        .attr("stroke-width", strokeWidth * strokeScale)
}




