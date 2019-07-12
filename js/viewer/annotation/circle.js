function Circle(attrs){
    var _self = this;

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);
    this._attrs["tag"] = "circle";
    this._attrs["cx"] = attrs["cx"] || null;
    this._attrs["cy"] = attrs["cy"] || null;
    this._attrs["r"] = attrs["r"] || 0;

    // Drag start event to draw a scribble
    this.drawStartHandler = function(newPoint){
        // Check if there's a centroid point (cx,cy) to begin drawing
        if (_self._attrs.cx == null || _self._attrs.cy == null) {
            _self.setAttributesByJSON({
                cx: newPoint.x,
                cy: newPoint.y
            });
        }
        // Update the radius as the user drags the mouse
        else {
            _self.setAttributesByJSON({
                r: _self.calculateRadius(newPoint)
            });
        } 
        _self.renderSVG();
    };

    // Drag end handler
    this.drawEndHandler = function(){
        this.parent.dispatchEvent('UpdateIndicatorLocation')
    }
}

Circle.prototype = Object.create(Base.prototype);
Circle.prototype.constructor = Circle;

Circle.prototype.calculateRadius = function(point){
    var radius;
    if(this._attrs.cx == null || this._attrs.cy == null){
        return null;
    }
    radius = Math.sqrt(Math.pow(point.x - this._attrs.cx, 2) + Math.pow(point.y - this._attrs.cy, 2));
    return radius;
};

// Draw a circle on the Openseadragon viewer
Circle.prototype.draw = function(){

    var _self = this;

    _self.svg = _self.parent.svg
        .append("circle")
        .attr("class", "annotation")
        .attr("stroke", _self._attrs["stroke"])
        .attr("fill", _self._attrs["fill"])
        .attr("stroke-width", _self._attrs["stroke-width"]);

    this.parent.dispatchEvent('DrawAnnotation', _self);
}