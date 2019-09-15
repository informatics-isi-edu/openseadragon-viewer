function AnnotationGroup(id, anatomy, description, parent){
    var _self = this;
    this.id = id || -1;
    this.description = description || "no description";
    this.anatomy = anatomy || "Unknown Anatomy";
    this.annotations = [];
    // this.indicator = null;
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

    // Add new annotation object (path/cirlce/rect)
    this.addAnnotation = function(type){
        var annotation = null;

        switch (type.toUpperCase()) {
            case "PATH":
                annotation = new Path({
                    "annotation-id" : this.id,
                    "parent" : this
                }); 
                break;
            case "POLYLINE":
                annotation = new Polyline({
                    "annotation-id" : this.id,
                    "parent" : this
                }); 
                break;
            case "POLYGON":
                annotation = new Polygon({
                    "annotation-id" : this.id,
                    "parent" : this
                }); 
                break;
            case "RECT":
                annotation = new Rect({
                    "annotation-id" : this.id,
                    "parent" : this
                }); 
                break;
            case "CIRCLE":
                annotation = new Circle({
                    "annotation-id" : this.id,
                    "parent" : this
                }); 
                break;
        };

        if(annotation != null){
            this.annotations.push(annotation);
        }
        
        return annotation;
    }

    // Dispatch the event to the parent
    this.dispatchEvent = function(type, data){
        
        switch(type){
            case "onClickChangeSelectingAnnotation":
                this.parent.dispatchEvent(type, {
                    groupID : this.id
                })
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

    // Get box boundaries of the group
    this.getBoxBoundaries = function(){
        return {
            x1 : this.x1,
            y1 : this.y1,
            x2 : this.x2,
            y2 : this.y2
        }
    }

    // Highlight annotation objects
    this.highlightAll = function(event){

        _self.annotations.forEach(function(annotation){
            var strokeWidth = annotation._attrs["stroke-width"] ? +annotation._attrs["stroke-width"] * 1.25 : 10;
            annotation.highlight({
                "stroke-width" : strokeWidth === 0 ? 10 : strokeWidth,
                "stroke" : "yellow"
            });
        })
    }

    // Render a g container to contain annotation objects 
    this.render = function(){

        var svg = d3.select(this.parent.svg)
            .append("g")
            .attr("annotation-id", this.id);
            
        this.svg = svg;
    
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

    this.unHighlightAll = function(){
        _self.annotations.forEach(function(annotation){
            annotation.unHighlight();
        })
    }
}













