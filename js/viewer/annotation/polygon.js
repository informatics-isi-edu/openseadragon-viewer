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
    console.log('insertPointAtDrawEnd', this._attrs["points"]);
    this._oldPoints = this._attrs["points"]; 
}
