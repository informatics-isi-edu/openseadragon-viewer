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
    this.dataPoints = [];
    this.renderPath = d3.line()
        .x(function (d, i) { return d.x; })
        .y(function (d, i) { return d.y; });
}

Path.prototype = Object.create(Base.prototype);
Path.prototype.constructor = Path;

Path.prototype.setupDrawing = function(attrs){

    var _self = this;
    
    if(attrs){
        this.setAttributesByJSON(attrs);
    };

    _self.svg = _self.parent.svg
        .append("path")
        .data([_self.dataPoints])
        .attr("class", "annotation")
        .attr("d", _self.renderPath)
        .attr("fill", _self._attrs["fill"])
        .attr("stroke", _self._attrs["stroke"])
        .attr("stroke-linejoin", _self._attrs["stroke-linejoin"])
        .attr("stroke-width", _self._attrs["stroke-width"]);
}

Path.prototype.insertPoint = function(point){
    var _self = this;

    this.dataPoints.push(point);
    
    this.svg.attr("d", function(d){
        _self._attrs["d"] = _self.renderPath(d)
        return _self._attrs["d"];
    })
}


