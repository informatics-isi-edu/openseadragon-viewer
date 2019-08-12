function Path(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._attrs["tag"] = "path";
    this._attrs["d"] = attrs["d"] || "";
    this._attrs["fill"] = attrs["fill"] || "";
    this._attrs["stroke"] = attrs["stroke"] || "";
    this._attrs["stroke-width"] = attrs["stroke-width"] || "";
    this._attrs["stroke-linecap"] = attrs["stroke-linecap"] || "";
    this.svg = null;
    this.renderLine = null;
    this.dataPoints = [];
}

Path.prototype = Object.create(Base.prototype);
Path.prototype.constructor = Path;


