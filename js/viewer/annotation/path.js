function Path(attrs){

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._attrs["tag"] = "path";
    this._attrs["d"] = attrs["d"] || "";
    
    this.svg = null;
    this.dataPoints = [];
    this.renderPath = d3.line()
        .x(function (d, i) { return d.x; })
        .y(function (d, i) { return d.y; });
}

Path.prototype = Object.create(Base.prototype);
Path.prototype.constructor = Path;

Path.prototype.setupDrawingAttrs = function(attrs){

    var _self = this;

    Base.prototype.setupDrawingAttrs.call(this, attrs);

    _self.svg
        .data([_self.dataPoints])
        .attr("d", _self.renderPath);
}

Path.prototype.insertPoint = function(point){
    var _self = this;

    this.dataPoints.push(point);
    
    this.svg.attr("d", function(d){
        _self._attrs["d"] = _self.renderPath(d)
        return _self._attrs["d"];
    })
}


