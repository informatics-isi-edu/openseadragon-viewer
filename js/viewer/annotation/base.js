function Base(attrs){
    attrs = attrs ? attrs : {};
    var _self = this;
    this.parent = attrs.parent;
    this._attrs = {
        "annotation-id" : attrs["annotation-id"] || -1,
        "tag" : attrs["tag"] || "",
        "fill" : attrs["fill"] || "none",
        "stroke" :  attrs["stroke"] || "",
        "stroke-width" : attrs["stroke-width"] || ""
    }

    this.onClickToSelectAnnotation = function(){
        _self.dispatchEvent("OnClickChangeSelectingAnnotation");
    };

    this.onMouseoverShowTooltip = function(){

        _self.dispatchEvent("OnMouseoverShowTooltip", {
            x : d3.event.pageX,
            y : d3.event.pageY
        })
    };

    this.onMousemoveShowTooltip = function(){
        _self.dispatchEvent("OnMousemoveShowTooltip", {
            x : d3.event.pageX,
            y : d3.event.pageY
        })
    };

    this.onMouseoutHideTooltip = function(){
        _self.dispatchEvent("OnMouseoutHideTooltip");
    };
}

Base.prototype.dispatchEvent = function(type, data){
    this.parent.dispatchEvent(type, data);
}

Base.prototype.highlight = function(highlightAttrs){

    for(var attr in highlightAttrs){
        this.svg.attr(attr, highlightAttrs[attr]);
    }
    // this.svg
    //     .attr("stroke", "black")
    //     .attr("stroke-width", 0.0001)
    //     .attr("fill", "yellow")
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
        value;

    for(attr in this._attrs){
        value = elem.getAttribute(attr);
        if(value != null){

            switch(attr){
                default:
                    this._attrs[attr] = value;
                    break;
            }
            
        }
    }
}

Base.prototype.renderSVG = function(){
    
    var attr,
        value;

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
            default:
                this.svg.attr(attr, value);
                break;
        }
    }
}

Base.prototype.toSVG = function(){
    var svgContent = "",
        attr;

    svgContent += "<" + this._attrs.tag + " ";
    for(attr in this._attrs){
        switch(attr){
            case "tag":
                break;
            default:
                svgContent += (attr + '="' + this._attrs[attr] + '" ');
                break;
        }
    }

    svgContent += '></' + this._attrs.tag + '>';
    return svgContent;
}

Base.prototype.unHighlight = function(){
    this.svg
        .attr("fill", this._attrs["fill"] || "")
        .attr("stroke", this._attrs["stroke"] || "")
        .attr("stroke-width", this._attrs["stroke-width"] || "")
}




