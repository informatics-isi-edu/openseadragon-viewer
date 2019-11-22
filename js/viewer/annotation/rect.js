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