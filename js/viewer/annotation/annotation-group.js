function AnnotationGroup(id, description, anatomy, parent){
    var _self = this;
    this.id = id || -1;
    this.description = description || "type your description";
    this.anatomy = anatomy || "Anatomy name";
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

    this.onClickSelect = function(){
        _self.dispatchEvent("OnClickChangeSelectingAnnotation");
    }

    this.highlightAll = function(event){

        var strokeWidth = this.parent.getStrokeWidth() || 0;

        _self.annotations.forEach(function(annotation){
            annotation.highlight({
                "stroke-width" : strokeWidth * 1,
                "stroke" : "yellow"
            });
        })
    }

    this.remove = function(){
        _self.svg.remove();
        // _self.indicator.element.removeEventListener('mouseenter', _self.onMouseoverDisplayBoundary);
        // _self.indicator.element.removeEventListener('mouseleave', _self.onMouseleaveDisplayBoundary);
        // _self.indicator.element.removeEventListener('click', _self.onClickSelect);
        // _self.parent.removeOverlay(_self.indicator.element);
        // _self.indicator = null;
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
        case "UpdateIndicatorLocation":
            this.updateDiagonalPoints();
            // this.updateIndicatorLocation();
            break;
        case "OnClickChangeSelectingAnnotation":
            this.parent.dispatchEvent(type, {
                id : this.id
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

// AnnotationGroup.prototype.locateFlag = function(isLocate){
//     this.isFlagShown = isLocate;
//     // this.indicator.element.style.display = (isLocate) ? "block" : "none";
// }

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

// AnnotationGroup.prototype.updateIndicatorLocation = function(){
//     var x = (this.x1 && this.x2) ? (this.x2 + this.x1) / 2 : 0;
//     var y = (this.y1 && this.y2) ? (this.y2 + this.y1) / 2 : 0;

//     if(this.indicator == null){
//         this.renderIndicator();
//     }

//     if(x !== 0 && y !== 0){
//         this.indicator.element.style.display = "block";
//     };

//     this.indicator.update(new OpenSeadragon.Point(x, y));
//     this.parent.redrawViewerContent();
// }

AnnotationGroup.prototype.render = function(){

    var svg = d3.select(this.parent.getSVGOverlayContainer().firstChild)
        .append("g")
        .attr("annotation-id", this.id);
        
    this.svg = svg;
    
    // if(this.indicator == null){
    //     this.renderIndicator();
    // }
}

// AnnotationGroup.prototype.renderIndicator = function(){
//     var x = (this.x1 && this.x2) ? (this.x2 + this.x1) / 2 : 0;
//     var y = (this.y1 && this.y2) ? (this.y2 + this.y1) / 2 : 0;
//     var indicatorElem = document.createElement("div");
//     indicatorElem.setAttribute("class", "indicator");
//     indicatorElem.innerHTML = "<i class='fa fa-tag'></i>";

//     if(this.x2 == null || this.y2 == null){
//         indicatorElem.style.display = "none";
//     }

//     this.indicator = this.parent.addOverlay(indicatorElem, new OpenSeadragon.Point(x, y))
//     this.indicator.element.addEventListener('mouseenter', this.onMouseoverDisplayBoundary);
//     this.indicator.element.addEventListener('mouseleave', this.onMouseleaveDisplayBoundary);
//     this.indicator.element.addEventListener('click', this.onClickSelect);
// }

AnnotationGroup.prototype.setDisplay = function(isDisplay){
    var displayStyle = (isDisplay) ? "block" : "none";

    this.isDisplay = isDisplay ? isDisplay : this.isDisplay;
    this.svg.attr("display", displayStyle);
}

AnnotationGroup.prototype.toSVG = function(){
    var svgContent = "";

    svgContent += '<g annotation-id="' + this.id + '" description="'+ this.description+'" anatomy="'+ this.anatomy +'">';
    for(i = 0; i < this.annotations.length; i++){
        svgContent += this.annotations[i].toSVG();
    };
    svgContent += "</g>";
    return svgContent;
}
