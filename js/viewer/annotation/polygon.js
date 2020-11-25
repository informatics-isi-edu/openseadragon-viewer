function Polygon(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "polygon";
    this._attrs["points"] = attrs["points"] || "";
    this._oldPoints = attrs["points"] || ""
    this.svg = null;
}

Polygon.prototype = Object.create(Base.prototype);
Polygon.prototype.constructor = Polygon;

Polygon.prototype.insertPoint = function (point) {
    var _self = this;
    var updateAttrs = {};

    if (_self._attrs.points == "") {
        updateAttrs = {
            points: point.x.toString() + ',' + point.y.toString()
        }
        _self._oldPoints = point.x.toString() + ',' + point.y.toString();
    }
    else {
        updateAttrs = {
            points: _self._oldPoints + ' ' + point.x.toString() + ',' + point.y.toString()
        }
    }
    // console.log('updateAttrs', updateAttrs);
    _self.setAttributesByJSON(updateAttrs);
    _self.renderSVG();
}

Polygon.prototype.insertPointAtDrawEnd = function () {
    this._oldPoints = this._attrs["points"]; 
}

// Why insertPoint & insertPointAtDrawEnd are needed?
// insertPoint - When the user starts adding a new point by dragging the mouse, this new point is added to the set of already fixed '_oldPoints'. As the mouse point is being moved around from point p1 to p2, the value of this._attrs["points"] will change from _oldPoints + p1 -> _oldPoints + p2.
// insertPointAtDrawEnd - When the drawing event is finished, i.e. the new vertex is decided, '_oldPoints' is updated to the set of original points plus this new vertex.