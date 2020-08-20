function Polygon(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "polygon";
    this._attrs["points"] = attrs["points"] || "";
    this._attrs["fill"] = attrs["fill"] || "";
    this._attrs["stroke"] = attrs["stroke"] || "";
    this._attrs["stroke-width"] = attrs["stroke-width"] || "";
    this._attrs["stroke-linecap"] = attrs["stroke-linecap"] || "";
    this.svg = null;
    this.renderLine = null;
    this.dataPoints = [];
}

Polygon.prototype = Object.create(Base.prototype);
Polygon.prototype.constructor = Polygon;


