function Rect(attrs){
    var _self = this;

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);
    this._attrs["tag"] = "rect";
    this._attrs["x"] = attrs["x"] || null;
    this._attrs["y"] = attrs["y"] || null;
    this._attrs["height"] = attrs["height"] || 0;
    this._attrs["width"] = attrs["width"] || 0;
    this.svg = null;

    // Drag start handler
    this.drawStartHandler = function(newPoint){
        // Check if there's a starting point (x,y) to begin drawing
        if (_self._attrs.x == null || _self._attrs.y == null) {
            _self.setAttributesByJSON({
                "x": newPoint.x,
                "y": newPoint.y
            });
        }
        // Update the width/height as the user drags the mouse
        else {
            _self.setAttributesByJSON({
                "width": Math.max(0, newPoint.x - +_self.svg.attr("x")),
                "height": Math.max(0, newPoint.y - +_self.svg.attr("y"))
            });
        }
        _self.renderSVG();
    };

    // Drag end handler
    this.drawEndHandler = function(){
        this.parent.dispatchEvent('UpdateIndicatorLocation')
    }
};

Rect.prototype = Object.create(Base.prototype);
Rect.prototype.constructor = Rect;

// Draw a rectangle on the Openseadragon viewer
Rect.prototype.draw = function(){

    var _self = this;

    _self.svg = _self.parent.svg
        .append("rect")
        .attr("class", "annotation")
        .attr("stroke", _self._attrs["stroke"])
        .attr("fill", _self._attrs["fill"])
        .attr("stroke-width", _self._attrs["stroke-width"]);

    this.parent.dispatchEvent('DrawAnnotation', _self);
}