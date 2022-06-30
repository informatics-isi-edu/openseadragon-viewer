function AnnotationGroup(id, anatomy, description, parent){
    var _self = this;
    this.id = id || -1;
    this.description = description || "no description";
    this.anatomy = anatomy || "Unknown Anatomy";
    this.annotations = [];
    this.parent = parent;

    // Top-left diagonal point
    this.x1 = null;
    this.y1 = null;
    // Bottom-right diagonal point
    this.x2 = null;
    this.y2 = null;
    // svg elem
    this.svg = null;
    this.isDisplay = true;
    this.isSelected = false;

    // the stroke that is used by annotations in this group
    this.stroke = [];

    // Add new annotation object (path/cirlce/rect)
    this.addAnnotation = function(type, subtype, annotAttrs){
        var annotation = null;
        var graphID = Date.parse(new Date()) + parseInt(Math.random() * 10000);
        var attrs = {
            "graph-id" : graphID,
            // "annotation-id" : this.id,
            "parent" : this
        }
        switch (type.toUpperCase()) {
            case "PATH":
                annotation = new Path(attrs);
                break;
            case "POLYLINE":
                annotation = new Polyline(attrs);
                break;
            case "POLYGON":
                annotation = new Polygon(attrs);
                break;
            case "RECT":
                annotation = new Rect(attrs);
                break;
            case "CIRCLE":
                annotation = new Circle(attrs);
                break;
            case "LINE":
                annotation = new Line(attrs);
                break;
            case "ARROWLINE":
                group = document.getElementById(this.id);
                if(group != null) {
                   markerDef = this.addMarkerDef(annotAttrs.stroke, subtype);
                   if(markerDef != null){
                     group.appendChild(markerDef);
                   }
                }
                attrs["stroke"] = annotAttrs.stroke;
                annotation = new ArrowLine(attrs, subtype);
                break;
        };

        if(annotation != null){
            this.annotations.push(annotation);
        }

        return annotation;
    }

    this.addMarkerDef = function (stroke, subtype, checkExists = true) {

        markerID = "arrow-" + subtype + "-" + stroke.slice(1, stroke.length);
        // Check if the definition is already added]
        if (checkExists && document.querySelector("#" + markerID)) {
            return;
        }

        var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        var marker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
        );
        marker.setAttributeNS(null, "id", markerID);
        marker.setAttributeNS(null, "markerUnits", "strokeWidth");
        marker.setAttributeNS(null, "markerWidth", 10);
        marker.setAttributeNS(null, "markerHeight", 10);
        marker.setAttributeNS(null, "orient", "auto");
        var arrowhead = null;
        
        switch(subtype){
            case "solid": 
                marker.setAttributeNS(null, "refX", 9.3);
                marker.setAttributeNS(null, "refY", 5);
                arrowhead = document.createElementNS("http://www.w3.org/2000/svg", "path");
                arrowhead.setAttributeNS(null, "fill", stroke);
                arrowhead.setAttributeNS(null, "d", "M 0 0 L 10 5 L 0 10 z");
                break;
            case "circle":
                marker.setAttributeNS(null, "refX", 6);
                marker.setAttributeNS(null, "refY", 3);
                arrowhead = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                arrowhead.setAttributeNS(null, "cx", "3");
                arrowhead.setAttributeNS(null, "cy", "3");
                arrowhead.setAttributeNS(null, "r", "3");
                arrowhead.setAttributeNS(null, "fill", stroke);
                break;
                case "stroke":
                marker.setAttributeNS(null, "fill", "None");
                marker.setAttributeNS(null, "refX", 9.3);
                marker.setAttributeNS(null, "refY", 5);
                arrowhead = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                arrowhead.setAttributeNS(null, "stroke", stroke);
                arrowhead.setAttributeNS(null, "points", "1 1, 9 5, 1 7");
                break;
        }
        
        marker.appendChild(arrowhead);
        defs.appendChild(marker);
        return defs;
    };

    // Dispatch the event to the parent
    this.dispatchEvent = function(type, data){

        switch(type){
            case "onClickChangeSelectingAnnotation":
                data["groupID"] = this.id;
                this.parent.dispatchEvent(type, data);
                break;
            case "onMouseoverShowTooltip":
                data["anatomy"] = this.anatomy;
                data["description"] = this.description;
                data["x1"] = this.x1;
                data["y1"] = this.y1;
                data["x2"] = this.x2;
                data["y2"] = this.y2;
                data["groupID"] = this.id;
                this.highlightAll();
                this.parent.dispatchEvent(type, data);
                break;
            case "onMouseoutHideTooltip":
                if(!this.isSelected){
                    this.unHighlightAll();
                }
                this.parent.dispatchEvent(type, data);
                break;
            default:
                this.parent.dispatchEvent(type, data);
                break;
        }
    }

    // Export group content
    this.exportToSVG = function(){

        if(this.annotations.length === 0){
            return "";
        }

        var rst = [], content;

        this.annotations.forEach(function (annot) {
            content = annot.exportToSVG();
            if (content != "") {
                rst.push(content);
            }
        });

        if (rst.length === 0) {
            return "";
        }

        return "<g id='" + this.id + "'>" + rst.join("") + "</g>";
    }

    // Get box boundaries of the group
    this.getBoxBoundaries = function(){
        return {
            x1 : this.x1,
            y1 : this.y1,
            x2 : this.x2,
            y2 : this.y2
        }
    }

    // Get number of annotations
    this.getNumOfAnnotations = function(){
        return this.annotations.length;
    }

    this.getStrokeScale = function(){
        return this.parent.getStrokeScale();
    }

    // Highlight annotation objects
    this.highlightAll = function(event){
        var strokeScale = this.getStrokeScale() || 1;
        var strokeWidth = 1;

        _self.annotations.forEach(function(annotation){
            strokeWidth = parseFloat(annotation._attrs["stroke-width"]) || 1;
            strokeWidth =  strokeWidth * strokeScale * 2 || 5;
            annotation.highlight({
                "stroke-width" : strokeWidth === 0 ? 5 : strokeWidth,
                // "stroke" : "yellow",
            });
        })
    }

    // Render a g container to contain annotation objects
    this.render = function(){

        var svg = d3.select(this.parent.svg)
            .append("g")
            .attr("id", this.id);

        this.svg = svg;

    }

    // Remove an annotation by graphID
    this.removeAnnotationByID = function(graphID){
        var index;
        var annotation = this.annotations.find(function(graph, i){
            if(graph.id ==  graphID){
                index = i;
                return true;
            }
        })

        if(!annotation){
            return
        }

        // remove annotation object from the collection
        this.annotations.splice(index, 1);

        // remove event handlers for the annotation
        annotation.unbind();

        // remove svg element
        annotation.svg.remove();
    }

    // Remove all annotations
    this.removeAllAnnotations = function(){
        this.annotations.forEach(function (annotation) {
            // remove event handlers for the annotation
            annotation.unbind();

            // remove svg element
            annotation.svg.remove();
        });

        // remove from the collection
        this.annotations = [];
    }

    this.setAttributesByJSON = function(attrs){
        var attr,
            value;

        for(attr in attrs){
            value = attrs[attr];
            switch(attr){
                case "description":
                case "anatomy":
                    this[attr] = value;
                    break;
            }
        }
    }

    this.setDisplay = function(isDisplay){
        var displayStyle = (isDisplay) ? "block" : "none";
        this.isDisplay = isDisplay;
        this.svg.attr("display", displayStyle);
    }

    this.updateDiagonalPoints = function(){

        // Set the annotation group boundaries based on the annotation
        for(var i = 0; i < this.annotations.length; i++){
            var annotation = this.annotations[i];
            var bbox = annotation.svg.node().getBBox();
            this.x1 = (this.x1 == null || bbox.x < this.x1) ? bbox.x : this.x1;
            this.y1 = (this.y1 == null || bbox.y < this.y1) ? bbox.y : this.y1;
            this.x2 = (bbox.x + bbox.width > this.x2) ? bbox.x + bbox.width : this.x2;
            this.y2 = (bbox.y + bbox.height > this.y2) ? bbox.y + bbox.height : this.y2;
        }
    }

    this.updateStrokeWidth = function(){
        _self.annotations.forEach(function(annotation){
            annotation.renderSVG();
        })
    }

    /**
     * Given an annotation, will update the this.stroke Array
     * @param {Base} annot
     */
    this.setGroupStrokeByAnnotation = function (annot) {
        var stroke = _self.parent.parent._utils.standardizeColor(annot._attrs.stroke);

        if (_self.stroke.indexOf(stroke) === -1) {
            _self.stroke.push(stroke);
        }
    };

    /**
    * This function changes the color(stroke) of the each annotation to the new value passed as param
    * @param {string} stroke the RGB value of the new color
    */

    this.changeArrowStroke = function(groupID, stroke) {

        defCollection = document.getElementById(groupID).getElementsByTagName("defs");
        for(def of defCollection) {

            for(markerDef of def.childNodes){

                markerElements = ["path", "polyline", "circle"];
                for (markerElement of markerElements){

                    arrowChild = markerDef.getElementsByTagName(markerElement)[0];
                    if(arrowChild == null){
                        continue;
                    }
                    if(markerElement == "polyline"){
                        arrowChild.setAttribute("stroke", stroke);
                    }
                    else{
                        arrowChild.setAttribute("fill", stroke);
                    }
                }
            }
        }
    }

    this.updateStroke = function(groupID, stroke) {
        var stroke = _self.parent.parent._utils.standardizeColor(stroke);

        _self.stroke = [stroke];
        _self.annotations.forEach(function (annotation) {
            annotation._attrs.stroke = stroke;
            if(annotation._tag == "line" && annotation._attrs["data-subtype"] != null){
                _self.changeArrowStroke(groupID, stroke)
                annotation._attrs["marker-end"] = "url(#arrow-" + annotation._subtype + "-" + stroke.slice(1, stroke.length) + ")";
            }
            // render the SVG after changing the color so that the new color is reflected in the viewer
            annotation.renderSVG();
        });
    }

    this.updateInfo = function(data){
        this.id = data.id;
        this.anatomy = data.anatomy;
        this.svg.attr("id", this.id);
    }

    this.unHighlightAll = function(){
        _self.annotations.forEach(function(annotation){
            annotation.unHighlight();
        })
    }
}
