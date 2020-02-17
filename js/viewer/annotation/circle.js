function Circle(attrs){
    attrs = attrs ? attrs : {};
    Base.call(this, attrs);
    this._attrs["tag"] = "circle";
    this._attrs["cx"] = attrs["cx"] || null;
    this._attrs["cy"] = attrs["cy"] || null;
    this._attrs["r"] = attrs["r"] || 0;
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

Circle.prototype.insertPoint = function(point){
    var _self = this;
    var updateAttrs = {};

    if (_self._attrs.cx == null || _self._attrs.cy == null){
        updateAttrs = {
            cx : point.x,
            cy: point.y
        };
    }
    else{
        updateAttrs = {
            r : _self.calculateRadius(point)
        }
    }
    _self.setAttributesByJSON(updateAttrs);
    _self.renderSVG();
}