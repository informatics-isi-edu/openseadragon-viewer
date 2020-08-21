function Base(attrs){
    attrs = attrs ? attrs : {};
    var _self = this;
    this.parent = attrs.parent;
    this.id = attrs["graph-id"] || -1;
    this.isDrawing = false;
    this.constants = attrs.parent.parent.parent.all_config.constants;
    this.urlParams = attrs.parent.parent.parent.parameters;

    // this is used to make sure that any property that is added to the SVG for display purpose, is not added while saving
    this._addedAttrs = {
        "vector-effect": {
            "isAdded": true,
            "value": "non-scaling-stroke"
        }
    };

    this._attrs = {
        "fill": "none",
        "stroke": this.constants.DEFAULT_STROKE,
        "stroke-width": this.constants.OUTPUT_SVG_STROKE_WIDTH,
        // "style": "",
        "vector-effect": "non-scaling-stroke"
    }

    this._tag = "";

    // it stores all the attributes that we are not handling right now, so that they can be added to the output SVG file
    this._ignoredAttrs = {};
    
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

            if (!(this._addedAttrs[attr])) {
                attributeList[attr] = this._attrs[attr];
            }
        }

        // read the ignored attributes after this._attrs, to ensure that the values in the input and output match
        for (attr in this._ignoredAttrs) {
            attributeList[attr] = this._ignoredAttrs[attr];
        }

        // add the attributes in sorted order
        Object.keys(attributeList).sort().forEach(function (key) {
            rst += (key + '="' + attributeList[key] + '" ');
        });

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
        value,
        discardedAttributes = ["id", "style"];

    for(attr in attrs){
        if (!attr || !attrs.hasOwnProperty(attr) || discardedAttributes.indexOf(attr) != -1) continue;
        value = attrs[attr];
        
        if (attr in this._addedAttrs) {
            // to make sure that the properties that we add to the SVG like vector-effect, are not added to the output in case they are not present in the input SVG file
            if (this._addedAttrs[attr].value === value) {
                // if the added value matches
                this._addedAttrs[attr] = false;
                continue;
            } else {
                // if the value does not matches then, add the actual value to the ignored attributes (so that when the export function is called, the actual value is added back since the ignored attributes are read second) and the value that we need to this._attrs
                this._ignoredAttrs[attr] = value;
            }
            // since attr is in _addedAttrs, it means that this property is necessary to display the SVG in OSD, and therefore the value is added to this._attrs
            this._attrs[attr] = this._addedAttrs[attr].value;
        } else {
            if (attr in this._attrs) {
                this._attrs[attr] = value;
            } else {
                this._ignoredAttrs[attr] = value;
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
