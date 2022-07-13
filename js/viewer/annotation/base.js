function Base(attrs){
    attrs = attrs ? attrs : {};
    var _self = this;
    this.parent = attrs.parent;
    this.id = attrs["graph-id"] || -1;
    this.isDrawing = false;
    this.constants = attrs.parent.parent.parent.config.constants;
    this.urlParams = attrs.parent.parent.parent.parameters;

    // this is used to make sure that any property that is added to the SVG for display purpose, is not added while saving
    this._addedAttributeNames = ["vector-effect"];

    // if this url parameter exists, we should honor the stroke width that are defined on SVG files
    if (!this.urlParams.enableSVGStrokeWidth) {
        this._addedAttributeNames.push("stroke-width");
    }

    // attributes that are used to display the SVG annotation in osd viewer
    this._attrs = {
        "fill": "none", // TODO should this be part of added attributes as well?
        "stroke": this.constants.DEFAULT_SVG_STROKE,
        "stroke-width": this.constants.DEFAULT_SVG_STROKE_WIDTH,
        "vector-effect": this.constants.DEFAULT_SVG_VECTOR_EFFECT,
    }

    // the check that needs to be performed to prevent empty object
    // can move this var to config and imported from there
    this._attributeCheck = {
        "rect": ["height", "width"],
        "circle": ["cx", "cy", "r"],
        "path": ["d"],
        "line": ["x1", "x2", "y1", "y2"],
        "polygon": ["points"]
    }

    this._tag = "";

    // it stores all the attributes that we are not handling right now, so that they can be added to the output SVG file
    this._ignoredAttrs = {};

    /**
     * This functions checks to see if the svg component has valid attributes for it to be drawn. This function makes sure that no empty attribute is added.
     * @param {object} attributes
     * @return {boolean} Boolean values representing if the component has valid dimensions
     */
    this.hasDimensions = function(attributes, tag) {
        // if the tag is not supported report the error
        if (!this._attributeCheck[tag]) {
            console.log(tag + " not supported currently");
            return false;
        }

        // check if all the required properties are present return false in case any of them is missing
        for (i = 0; i < this._attributeCheck[tag].length; i++) {
            if (!attributes[this._attributeCheck[tag][i]]) {
                return false;
            }
        }

        return true;
    }

    this.exportToSVG = function(){

        // Check to see if there are necessary dimensions needed to construct the component. This makes sure that no empty components are added to the final SVG output file.
        if (!this.hasDimensions(this._attrs, this._tag)) {
            return "";
        }
        var tag = this._tag;
        var rst = "<" + tag + " ";
        var attr;
        var attributeList = {}
        for(attr in this._attrs){
            // only add non-empty attributes
            if (!this._attrs[attr] || this._attrs[attr] === null){
                continue;
            }

            // don't add the attributes that are added by osd viewer
            if (this._addedAttributeNames.indexOf(attr) !== -1) {
                continue;
            }

            attributeList[attr] = this._attrs[attr];
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

Base.prototype.highlight = function(highlightAttrs){
    for(var attr in highlightAttrs){
        this.svg.attr(attr, highlightAttrs[attr]);
    }
}

Base.prototype.renderSVG = function(annotationType){

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

    // add all the attributes
    for(attr in this._attrs){

        value = this._attrs[attr];
        if (attr === "stroke-width") {
            // TODO what if the value is not in pixel? (it can be pixel)
            value = (parseFloat(value) || 1) * strokeScale;
        }
        this.svg.attr(attr, value);
    }
}

Base.prototype.setAttributesByJSON = function(attrs){
    var attr,
        value,
        discardedAttributes = ["id", "style"];

    for(attr in attrs){
        if (!attr || !attrs.hasOwnProperty(attr) || discardedAttributes.indexOf(attr) != -1) {
            continue;
        }

        value = attrs[attr];

        // if it's any of the attributes that we should ignore
        if (!(attr in this._attrs) || this._addedAttributeNames.indexOf(attr) !== -1) {
            this._ignoredAttrs[attr] = value;
        } else {
            this._attrs[attr] = value;
        }
    }

    // update the stroke in the group
    this.parent.setGroupStrokeByAnnotation(this);
}

Base.prototype.unHighlight = function(){
    var strokeScale = this.parent.getStrokeScale() || 1;
    var strokeWidth = parseFloat(this._attrs["stroke-width"]) || 1;

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



Base.prototype.editText = function (localpoint) {

    var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    var textdiv = document.createElement("div");
    var input = document.createElement("textarea");
    input.name = "post";
    input.maxLength = "5000";
    input.cols = "80";
    input.rows = "40";
    textdiv.appendChild(input); 
    textdiv.setAttribute("contentEditable", "true");
    textdiv.setAttribute("width", "auto");
    myforeign.setAttribute("width", "100%");
    myforeign.setAttribute("height", "100%");
    myforeign.classList.add("foreign"); //to make div fit text
    textdiv.classList.add("insideforeign"); //to make div fit text
    myforeign.setAttributeNS(null, "transform", "translate(" + localpoint.x + " " + localpoint.y + ")");
    myforeign.appendChild(textdiv);
    this.svg.appendChild(myforeign);
}