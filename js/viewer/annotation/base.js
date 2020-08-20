function Base(attrs){
    attrs = attrs ? attrs : {};
    var _self = this;
    this.parent = attrs.parent;
    this.id = attrs["graph-id"] || -1;
    this.isDrawing = false;
    this.constants = attrs.parent.parent.parent.all_config.constants;
    this.urlParams = attrs.parent.parent.parent.parameters;

    // this is used to make sure that any property that is added to the SVG for display purpose, is not added while saving
    this._addedProperties = {
        "vector-effect": true
    };

    // TODO figure out why, where graph-id is being used. If it is necessary for proper functioning of the code remove it from this._attrs and add it as a private variable. If not then remove it and just pass parent and not attrs to base.js

    this._attrs = {
        "graph-id": attrs["graph-id"] || -1,
        "fill": "none",
        "stroke": this.constants.DEFAULT_STROKE,
        "stroke-width": this.constants.OUTPUT_SVG_STROKE_WIDTH,
        // "style": "",
        "vector-effect": "non-scaling-stroke"
    }

    this._tag = "";

    // it stores all the attributes that we are not handling right now, so that they can be added to the output SVG file
    this._ignoredAttributes = {};
    
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

    this.exportToSVG = function(){

        // Check to see if there are necessary dimensions needed to construct the component. This makes sure that no empty components are added to the final SVG output file.
        if (!this.hasDimensions(this._attrs)) {
            return "";
        }
        var tag = this._tag;
        var rst = "<" + tag + " ";
        var attr;
        var attributeList = {}

        for(attr in this._attrs){
            if (!this._attrs[attr] || this._attrs[attr] === null){
                continue;
            }

            switch(attr){
                case "graph-id":
                    break;
                default:
                    if (!(this._addedProperties[attr])) {
                        attributeList[attr] = this._attrs[attr];
                    }
                    break;  
            }
        }

        for (attr in this._ignoredAttributes) {
            attributeList[attrs] = this._ignoredAttributes[attr];
        }

        // sort the attributes to make the output deterministic
        var sortedAttributeList = {};
        Object.keys(attributeList).sort().forEach(function (key) {
            sortedAttributeList[key] = attributeList[key];
        });

        for(attr in sortedAttributeList){
            rst += (attr + '="' + sortedAttributeList[attr] + '" ');
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

/**
 * This functions check to see if the properties mentioned in this._addedProperties are present in the attribute list which is used to initialize this object.
 * @param {object} attrs
 */
Base.prototype.updateAddedProperties = function (attrs) {
    for (attr in attrs) {
        if (attr in this._addedProperties) {
            this._addedProperties[attr] = false;
        }
    }
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
            .append(this._tag)
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
            case "style":
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
        if (attr && attr.length > 0 && attr != 'id' && attr != 'style' && value) {
            if (attr in this._attrs) {
                this._attrs[attr] = value;
            } else {
                // if the attribute is not handled by us, add it to the ignored list
                this._ignoredAttributes[attr] = value;
            }
        }
    }

    this.updateAddedProperties(attrs);
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
