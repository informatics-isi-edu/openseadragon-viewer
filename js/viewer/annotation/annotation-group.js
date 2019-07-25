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

    // Add new annotation object (scribble/cirlce/rect)
    this.addAnnotation = function(type){
        var annotation = null;

        switch (type.toUpperCase()) {
            case "SCRIBBLE":
                annotation = new Scribble({
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
            case "OnClickChangeSelectingAnnotation":
                this.parent.dispatchEvent(type, {
                    groupID : this.id
                })
                break;
            case "OnMouseoverShowTooltip":
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
            case "OnMouseoutHideTooltip":
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

    // Highlight annotation objects
    this.highlightAll = function(event){

        _self.annotations.forEach(function(annotation){
            annotation.highlight({
                "stroke-width" : 2,
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
    
        this.isDisplay = isDisplay ? isDisplay : this.isDisplay;
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













