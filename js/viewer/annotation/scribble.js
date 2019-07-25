function Scribble(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._attrs["tag"] = "path";
    this._attrs["stroke-linejoin"] = attrs["stroke-linejoin"] || "round";
    this._attrs["d"] = attrs["d"] || "";
    this.svg = null;
    this.renderLine = null;
    this.dataPoints = [];
}

Scribble.prototype = Object.create(Base.prototype);
Scribble.prototype.constructor = Scribble;


