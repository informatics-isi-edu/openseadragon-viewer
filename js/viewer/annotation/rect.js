function Rect(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);
    this._attrs["tag"] = "rect";
    this._attrs["x"] = attrs["x"] || null;
    this._attrs["y"] = attrs["y"] || null;
    this._attrs["height"] = attrs["height"] || 0;
    this._attrs["width"] = attrs["width"] || 0;
    this.svg = null;
};

Rect.prototype = Object.create(Base.prototype);
Rect.prototype.constructor = Rect;


Rect.prototype.insertPoint = function(point){
    var _self = this;
    var updateAttrs = {};

    if (_self._attrs.x == null || _self._attrs.y == null){
        updateAttrs = {
            x : point.x,
            y: point.y
        };
    }
    else{
        updateAttrs = {
            width : Math.max(0, point.x - _self._attrs["x"]),
            height : Math.max(0, point.y - _self._attrs["y"])
        }
    }
    _self.setAttributesByJSON(updateAttrs);
    _self.renderSVG();
}