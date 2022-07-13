function Text(attrs) {

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "text";
    this._attrs["x"] = attrs["x"] || null;
    this._attrs["y"] = attrs["y"] || null;
    this._attrs["fill"] = attrs["fill"] || "red";
    this._attrs["font-size"] = attrs["font-size"] || 2000;
    this._attrs["font-weight"] = attrs["font-weight"] || 700;
    this.svg = null;
}

Text.prototype = Object.create(Base.prototype);
Text.prototype.constructor = Text;

Text.prototype.insertPoint = function (point) {
    var _self = this;
    var updateAttrs = {};

    // Only update the x and y attributes once when they are empty at the start
    if (_self._attrs.x == null || _self._attrs.y == null) {
        updateAttrs = {
        x: point.x,
        y: point.y,
        };
    } 
    // _self.editText(point);
    _self.setAttributesByJSON(updateAttrs);
    _self.renderSVG();
};

// Text.prototype.editText = function (point) {

//     var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
//     var textdiv = document.createElement("div");
//     var input = document.createElement("textarea");
//     input.name = "post";
//     input.maxLength = "5000";
//     input.cols = "80";
//     input.rows = "40";
//     div.appendChild(input); 
//     textdiv.setAttribute("contentEditable", "true");
//     textdiv.setAttribute("width", "auto");
//     myforeign.setAttribute("width", "100%");
//     myforeign.setAttribute("height", "100%");
//     myforeign.classList.add("foreign"); //to make div fit text
//     textdiv.classList.add("insideforeign"); //to make div fit text
//     myforeign.setAttributeNS(null, "transform", "translate(" + localpoint.x + " " + localpoint.y + ")");
//     myforeign.appendChild(textdiv);
//     this.parent.svg.appendChild(myforeign);
// }