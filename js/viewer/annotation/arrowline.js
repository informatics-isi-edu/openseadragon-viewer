function ArrowLine(attrs, subtype) {
  attrs = attrs ? attrs : {};
  Base.call(this, attrs);

  // This tag needs to be line as the HTML tag used for arrow line is line itself
  this._tag = "line";
  this._subtype = subtype;
  this._attrs["x1"] = attrs["x1"] || null;
  this._attrs["y1"] = attrs["y1"] || null;
  this._attrs["x2"] = attrs["x2"] || null;
  this._attrs["y2"] = attrs["y2"] || null;
  this._attrs["marker-end"] = attrs["marker-end"];
  this._attrs["data-subtype"] = subtype;
  this._attrs["data-markerid"] = attrs["markerID"]
  this.svg = null;
}

ArrowLine.prototype = Object.create(Base.prototype);
ArrowLine.prototype.constructor = ArrowLine;

ArrowLine.prototype.insertPoint = function (point) {
  var _self = this;
  var updateAttrs = {};

  if (_self._attrs.x1 == null || _self._attrs.y1 == null) {
    // when the line is first added both the start and end point are assigned the same.
    updateAttrs = {
      x1: point.x,
      y1: point.y,
      x2: point.x,
      y2: point.y,
    };
  } else {
    updateAttrs = {
      x2: point.x,
      y2: point.y,
      "marker-end": _self._attrs["marker-end"],
      // This marker-end line adds the arrow-head to the line
      // "marker-end": "url(#arrow)",
    };
  }
  _self.setAttributesByJSON(updateAttrs);
  _self.renderSVG("arrowline");
};