function Polygon(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "polygon";
    this._attrs["points"] = attrs["points"] || "";
    this.svg = null;
    this.renderLine = null;
    this.dataPoints = [];
}

Polygon.prototype = Object.create(Base.prototype);
Polygon.prototype.constructor = Polygon;


