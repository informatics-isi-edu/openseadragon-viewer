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
    // this.isFlagShown = true;

    this.highlightAll = function(event){

        _self.annotations.forEach(function(annotation){
            annotation.highlight({
                "stroke-width" : 2,
                "stroke" : "yellow"
            });
        })
    }

    this.remove = function(){
        _self.svg.remove();
    }

    this.unHighlightAll = function(){
        _self.annotations.forEach(function(annotation){
            annotation.unHighlight();
        })
    }
}

AnnotationGroup.prototype.add = function(annotation){
    if(annotation.parent == null){
        annotation.parent = this;
    }
    this.annotations.push(annotation);
}

// Add new annotation object (scribble/cirlce/rect)
AnnotationGroup.prototype.addAnnotation = function(type){
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
        this.add(annotation);
    }
    
    return annotation;
}

AnnotationGroup.prototype.changeOpacity= function(opacity){
    opacity = opacity ? opacity : 1;
    this.svg.attr("opacity", opacity);
}

// Dispatch the event to the parent
AnnotationGroup.prototype.dispatchEvent = function(type, data){
    
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

AnnotationGroup.prototype.setAttributesByJSON = function(attrs){
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

AnnotationGroup.prototype.updateDiagonalPoints = function(){

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

AnnotationGroup.prototype.render = function(){

    var svg = d3.select(this.parent.svg)
        .append("g")
        .attr("annotation-id", this.id);
        
    this.svg = svg;

}

AnnotationGroup.prototype.setDisplay = function(isDisplay){
    var displayStyle = (isDisplay) ? "block" : "none";

    this.isDisplay = isDisplay ? isDisplay : this.isDisplay;
    this.svg.attr("display", displayStyle);
}
