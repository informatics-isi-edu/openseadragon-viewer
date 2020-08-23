function Polyline(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "polyline";
    this._attrs["points"] = attrs["points"] || "";
    this.svg = null;
    this.renderLine = null;
    this.dataPoints = [];
}

Polyline.prototype = Object.create(Base.prototype);
Polyline.prototype.constructor = Polyline;


