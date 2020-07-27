function Base(attrs){
    attrs = attrs ? attrs : {};
    var _self = this;
    this.parent = attrs.parent;
    this.id = attrs["graph-id"] || -1;
    this.isDrawing = false;
    this.constants = attrs.parent.parent.parent.all_config.constants;
    this.urlParams = attrs.parent.parent.parent.parameters;
    this._attrs = {
        // "annotation-id" : attrs["annotation-id"] || -1,
        "graph-id" : attrs["graph-id"] || -1,
        "tag" : attrs["tag"] || "",
        "fill" : attrs["fill"] || "none",
        "stroke" :  attrs["stroke"] || "",
        "stroke-width": attrs["stroke-width"] || this.constants.OUTPUT_SVG_STROKE_WIDTH,
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
        var styleAttributes = ['fill', "stroke", "stroke", "stroke-width"];

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
            // Ingoring style because that will be added at the end.
            // Ignoreing vector-effect becasue this properpty is not needed in the output file
            if (!this._attrs[attr] || this._attrs[attr] === null || attr === "style" || attr == "vector-effect"){
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

/**
 * This functions checks to see if enableSVGStrokeWidth is true or false. If it is true then it return the value passed as its param, else it returns the default line thickness which is set in the config file
 * @param {string} value it is the stroke-width
 * @return {int} the desired stroke-width
 */
Base.prototype.getStrokeWidth = function (value) {
    return this.urlParams.enableSVGStrokeWidth ? (parseInt(value) || 1) : parseInt(this.constants.DEFAULT_LINE_THICKNESS);
}

Base.prototype.highlight = function(highlightAttrs){

    for(var attr in highlightAttrs){
        if (attr == "stroke-width") {
            highlightAttrs[attr] = this.getStrokeWidth(highlightAttrs[attr]) * this.parent.getStrokeScale() * 1.25;
            // stroke-width is multiplied by 1.25 for highlighting it
        }
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
            
        // prevent the default behavior of osd by adding an empty click handler
        new OpenSeadragon.MouseTracker({
            element: this.svg.node(),
            clickHandler: function (e) {
                // intentially left empy. we just want to prevent the default behavior (zoom)
            }
        });
    }

    for(attr in this._attrs){
        value = this._attrs[attr];
        
        switch(attr){
            case "tag":
                break;
            case "stroke-width":
                value = this.getStrokeWidth(value);
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
    var strokeWidth = this.getStrokeWidth(this._attrs["stroke-width"]);

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
