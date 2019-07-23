function Scribble(attrs){

    var _self = this;

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

Scribble.prototype.addDataPoint = function(point){
    this.dataPoints.push(point);
}

Scribble.prototype.convertPathPixelToPoints = function(refPoint, refUnit, pixelPoints){

    if(!refPoint || !pixelPoints){ return; }

    for(var j = 0; j < pixelPoints.length; j++){
        var type = pixelPoints[j].type;
        var data = pixelPoints[j].values;

        switch(type){
            case "M":
            case "m":
                pixelPoints[j].values[0] = (type == "M") ? refPoint.x + (data[0] * refUnit.x) : (data[0] * refUnit.x);
                pixelPoints[j].values[1] = (type == "M") ? refPoint.y + (data[1] * refUnit.y) : (data[1] * refUnit.y);
                break;
            case "L":
            case "l":
                pixelPoints[j].values[0] = (type == "L") ? refPoint.x + (data[0] * refUnit.x) : (data[0] * refUnit.x);
                pixelPoints[j].values[1] = (type == "L") ? refPoint.y + (data[1] * refUnit.y) : (data[1] * refUnit.y);
                break;
            case "H":
            case "h":
                pixelPoints[j].values[0] = (type == "H") ? refPoint.x + (data[0] * refUnit.x) : data[0] * refUnit.x;
                break;
            case "V":
            case "v":
                pixelPoints[j].values[0] = (type == "V") ? refPoint.y + (data[0] * refUnit.y) : (data[0] * refUnit.y);
                break;
            case "C":
            case "c":
                pixelPoints[j].values[0] = (type == "C") ? refPoint.x + (pixelPoints[j].values[0] * refUnit.x) : (pixelPoints[j].values[0] * refUnit.x);
                pixelPoints[j].values[1] = (type == "C") ? refPoint.y + (pixelPoints[j].values[1] * refUnit.y) : (pixelPoints[j].values[1] * refUnit.y);
                pixelPoints[j].values[2] = (type == "C") ? refPoint.x + (pixelPoints[j].values[2] * refUnit.x) : (pixelPoints[j].values[2] * refUnit.x);
                pixelPoints[j].values[3] = (type == "C") ? refPoint.y + (pixelPoints[j].values[3] * refUnit.y) : (pixelPoints[j].values[3] * refUnit.y);
                pixelPoints[j].values[4] = (type == "C") ? refPoint.x + (pixelPoints[j].values[4] * refUnit.x) : (pixelPoints[j].values[4] * refUnit.x);
                pixelPoints[j].values[5] = (type == "C") ? refPoint.y + (pixelPoints[j].values[5] * refUnit.y) : (pixelPoints[j].values[5] * refUnit.y);
                break;
            case "S":
            case "s":
                pixelPoints[j].values[0] = (type == "S") ? refPoint.x + (pixelPoints[j].values[0] * refUnit.x) : (pixelPoints[j].values[0] * refUnit.x);
                pixelPoints[j].values[1] = (type == "S") ? refPoint.y + (pixelPoints[j].values[1] * refUnit.y) : (pixelPoints[j].values[1] * refUnit.y);
                pixelPoints[j].values[2] = (type == "S") ? refPoint.x + (pixelPoints[j].values[2] * refUnit.x) : (pixelPoints[j].values[2] * refUnit.x);
                pixelPoints[j].values[3] = (type == "S") ? refPoint.y + (pixelPoints[j].values[3] * refUnit.y) : (pixelPoints[j].values[3] * refUnit.y);
                break;
        } 
    }
    return pixelPoints;
}

// Draw a scribble on the Openseadragon viewer
Scribble.prototype.draw = function(){

    var _self = this;

    _self.renderLine = d3.line()
        .x(function (d, i) { return d.x; })
        .y(function (d, i) { return d.y; });

    _self.svg = _self.parent.svg
        .append("path")
        .data([_self.dataPoints])
        .attr("class", "annotation")
        .attr("d", _self.renderLine)
        .attr("fill", _self._attrs["fill"] || "")
        .attr("stroke", _self._attrs["stroke"] || "")
        .attr("stroke-linejoin", _self._attrs["stroke-linejoin"] || "")
        .attr("stroke-width", _self._attrs["stroke-width"] || "");

    
    this.parent.dispatchEvent('DrawAnnotation', _self);
}



