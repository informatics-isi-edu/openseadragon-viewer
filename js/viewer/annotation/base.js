function Base(attrs){
    attrs = attrs ? attrs : {};
    var _self = this;
    this.parent = attrs.parent;
    this.id = attrs["graph-id"] || -1;
    this.isDrawing = false;
    this._attrs = {
        // "annotation-id" : attrs["annotation-id"] || -1,
        "graph-id" : attrs["graph-id"] || -1,
        "tag" : attrs["tag"] || "",
        "fill" : attrs["fill"] || "none",
        "stroke" :  attrs["stroke"] || "",
        "stroke-width" : attrs["stroke-width"] || "1px",
        "style" : "",
        "vector-effect" : attrs["vector-effect"] || "non-scaling-stroke"
    }
    /**
     * This functions checks to see if the svg component has valid attributes for it to be drawn. This function makes sure that no empty attribute is added.
     * @param {object} attributes
     * @return {boolean} Boolean values representing if the component has valid dimensions
     */
    this.hasDimensions = function(attributes) {
        if ((attributes["height"] && attributes["width"]) || (attributes["d"]) || (attributes["cx"] && attributes["cy"] && attributes["r"])) {
            return true;
        }
        return false;
    }
    /**
     * This functions removes the style attributes, appends them to a string and returns them.
     * @return {string}
     */
    this.getStyle = function() {
        var styleString = "";
        var styleAttributes = ['fill', "stroke", "stroke", "vector-effect", "stroke-width"];

        for (var i = 0; i <  styleAttributes.length; i++) {
            if (this._attrs[styleAttributes[i]] && this._attrs[styleAttributes[i]].length > 0) {
                styleString += styleAttributes[i] + ':' + this._attrs[styleAttributes[i]] + ';';
                this._attrs[styleAttributes[i]] = null;
            }
        }

        if (styleString[styleString.length - 1] == ';') {
            styleString = styleString.slice(0, styleString.length - 1);
        }

        return styleString;
    }

    this.exportToSVG = function(){

        // Check to see if there are necessary dimensions needed to construct the component. This makes sure that no empty components are added to the final SVG output file.
        if (!this.hasDimensions(this._attrs)) {
            return "";
        }

        var tag = this._attrs["tag"];
        var rst = "<" + tag + " ";
        var attr;

        // if(this.parent.id !== ""){
        //     rst += 'id="' + this.parent.id + '" ';
        // };

        var style = this.getStyle();
        if (style.length > 0) {
            this._attrs["style"] = style;
        }

        for(attr in this._attrs){
            if(!this._attrs[attr] || this._attrs[attr] === null || attr === "style"){
                continue;
            }

            switch(attr){
                case "tag":
                case "graph-id":
                    break;
                default:
                    rst += (attr + '="' + this._attrs[attr] + '" ');
                    break;  
            }
        }

        // The style is added at the end
        if (this._attrs["style"].length > 0) {
            rst += ('style="' + this._attrs["style"] + '" ');
        }
        rst += "></" + tag + ">";
        // console.log('rst', rst, this._attrs);
        return rst;
    }

    this.onClickToSelectAnnotation = function(){
        _self.dispatchEvent("onClickChangeSelectingAnnotation", {
            graphID : _self.id || ""
        });
    };

    this.onMouseoverShowTooltip = function(){

        if(_self.isDrawing){
            return;
        }

        _self.dispatchEvent("onMouseoverShowTooltip", {
            x : d3.event.pageX,
            y : d3.event.pageY
        })
    };

    this.onMousemoveShowTooltip = function(){
        if(_self.isDrawing){
            return;
        }

        _self.dispatchEvent("onMousemoveShowTooltip", {
            x : d3.event.pageX,
            y : d3.event.pageY
        })
    };

    this.onMouseoutHideTooltip = function(){
        if(_self.isDrawing){
            return;
        }

        _self.dispatchEvent("onMouseoutHideTooltip");
    };
}

Base.prototype.dispatchEvent = function(type, data){
    this.parent.dispatchEvent(type, data);
}

Base.prototype.setDrawing = function(isDrawing){
    this.isDrawing = isDrawing;
}

Base.prototype.setupDrawingAttrs = function(attrs){

    this.setDrawing(true);

    if(attrs){
        this.setAttributesByJSON(attrs);
    };

    this.renderSVG();
}

Base.prototype.getAttribute = function(attr){
    if(this._attrs.hasOwnProperty(attr)){
        return this._attrs[attr];
    }
    else{
        return null;
    }
}

Base.prototype.getAttributes = function(attrs){
    var attr,
        resAttr = {};

    if(attrs.length > 0){
        attrs.forEach(function(attr){
            if(this._attrs.hasOwnProperty(attr)){
                resAttr[attr] = this._attrs[attr];
            };
        })
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

Base.prototype.unbind = function(){

    if(this.svg == null){         
        this.svg.on("mouseover", null)
            .on("mousemove", null)
            .on("mouseout", null)
            .on('click', null);
    }
}



