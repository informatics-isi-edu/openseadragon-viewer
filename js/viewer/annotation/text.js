function Text(attrs) {

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "text";
    this._attrs["x"] = (attrs["x"] / 2);
    this._attrs["y"] = (attrs["y"] / 2);
    this._attrs["stroke"] = attrs["stroke"] || "red";

    // Relative font size
    var viewerParent = this.parent.parent.parent;
    var containerSize = viewerParent.osd.viewport.containerSize;

    this._ratio = Math.max(attrs["x"]/containerSize.x, attrs["y"]/containerSize.y);

    this._attrs["font-size"] = attrs["font-size"] || this._ratio * 14;
    this._attrs["font-weight"] = attrs["font-weight"] || 400;
    this.svg = null;
    this.foreignObj = null;

    // Foreign object that contains the annotation input and transformed text p tag
    this.setForeignObj = function(obj) {
        this.foreignObj = obj;
    }

    this.getForeignObj = function() {
        return this.foreignObj;
    }
}

Text.prototype = Object.create(Base.prototype);
Text.prototype.constructor = Text;

/**
 * This function is used to place the annotation at the desired position when user clicks on the OSD canvas
 * @param {point} The x and y coordinates of the point are used to position the annotation
 */
Text.prototype.positionAnnotation = function (point) {
    var _self = this;
    var updateAttrs = {
        x: point.x,
        y: point.y,
    };

    _self.setAttributesByJSON(updateAttrs);
    _self.renderSVG();
};
      


/**
 * Function to transform the <textarea> input to <p> tag when annotation tool is switched.
 */
Text.prototype.transform = function () {

    if(textInput.value && textInput.value.trim() != "")
    {
        var pText = this.createPTag(textInput);
        var foreignObj = this.getForeignObj();
        var div = foreignObj.childNodes[0];
        var h = div.style.top;
        var w = div.style.left;
        foreignObj.style.width = pText.style.width;
        foreignObj.style.height = pText.style.height;
        var divPadding = window.getComputedStyle(div, null).getPropertyValue('padding');
        divPadding = parseInt(divPadding.slice(0, divPadding.length - 2)) || 0;
        var divBorder = window.getComputedStyle(div, null).getPropertyValue('border').split(" ")[0];
        divBorder = parseInt(divBorder.slice(0, divBorder.length - 2)) || 0;
        if(h){
            h = parseInt(h.slice(0, h.length - 2))
        }
        else{
            h = 0;
        }
        if(w){
            w = parseInt(w.slice(0, w.length - 2))
        }
        else{
            w = 0;
        }
        foreignObj.setAttribute("x", this._attrs["x"] + w + divPadding + divBorder);
        foreignObj.setAttribute("y", this._attrs["y"] + h + divPadding + divBorder);
        foreignObj.setAttribute("tabindex", -1);
        foreignObj.innerHTML = "";
        foreignObj.appendChild(pText);
        pText.style.height = "fit-content";
        pText.style.width = "fit-content";
    } else {
        var foreignObj = this.getForeignObj();
        foreignObj.parentNode.removeChild(foreignObj);
    }
}

/**
 * This function creates a <p> tag to be appended as a child to the foreign object.
 * @param {*} originalObj - This object is the original object that is to be replaced by the p tag.
 * The object will be a <textarea> while switching annotation tool and <p> tag from the SVG namespace
 * while importing annotations.
 * @returns <p> tag HTML element
 */
Text.prototype.createPTag = function (originalObj) {

    var _self = this;
    var pText = document.createElement("p");
    var inputValue = originalObj.value || originalObj.innerHTML;
    inputValue = inputValue.replace(/\n/g, "<br />");
    pText.innerHTML = inputValue;
    pText.style.whiteSpace = "pre-wrap";
    pText.style.fontSize = originalObj.style.fontSize;
    pText.style.height = originalObj.style.height;
    pText.style.width = (originalObj.clientWidth || originalObj.width) + "px";
    pText.style.color = originalObj.style.color;
    // pText.classList.add("text-hover");
    var foreignObj = this.getForeignObj();
    // pText.addEventListener("click", this.textboxClickHandler);
    pText.classList.add("text-hover");

    _self.onClickToSelectAnnotation = function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        _self.parent.dispatchEvent("onClickChangeSelectingAnnotation",  {
            graphID : _self.id || ""
        });
    }

    _self.onMouseoutHideTooltip = function (e) {
        e.stopImmediatePropagation();
        if(_self.isDrawing){
            return;
        }
        _self.parent.dispatchEvent("onMouseoutHideTooltip");
    }

    _self.onMouseoverShowTooltip = function (e) {
        e.stopImmediatePropagation();
        if(_self.isDrawing){
            return;
        }
        _self.parent.dispatchEvent("onMouseoverShowTooltip", {
            x : e.pageX,
            y : e.pageY
        });
    }

    _self.onMousemoveShowTooltip = function (e) {
        e.stopImmediatePropagation();
        if(_self.isDrawing){
            return;
        }
        _self.parent.dispatchEvent("onMousemoveShowTooltip", {
            x : e.pageX,
            y : e.pageY
        });
    }
    
    pText.addEventListener("click", _self.onClickToSelectAnnotation);
    pText.addEventListener("mouseover", _self.onMouseoverShowTooltip);
    pText.addEventListener("mousemove", _self.onMousemoveShowTooltip);
    pText.addEventListener("mouseout", _self.onMouseoutHideTooltip);

    new OpenSeadragon.MouseTracker({
        element: pText,
        clickHandler: function (e) {
            // intentially left empy. we just want to prevent the default behavior (zoom)
        }
    });
    return pText;
}

Text.prototype.removeText = function () {

    var foreignObj = this.getForeignObj();
    if(foreignObj == null) return;
    var pText = foreignObj.getElementsByTagName("p")[0];

    pText.removeEventListener("click", this.onClickToSelectAnnotation);
    pText.removeEventListener("mouseover", this.onMouseoverShowTooltip);
    pText.removeEventListener("mouseout", this.onMouseoutHideTooltip);
    foreignObj.parentNode.removeChild(foreignObj);  
}

Text.prototype.textboxClickHandler = function (e) {
    e.stopImmediatePropagation();
    console.log("Text annotation is clicked");
    var foreignObj = this.getForeignObj();
    foreignObj.parentNode.removeChild(foreignObj);
}

Text.prototype.calculateZoomRatio = function (fontSize = 14) { 

    var viewerParent = this.parent.parent.parent;
    var viewport = viewerParent.osd.viewport;
    var zoom = viewport.getZoom();
    var defaultZoom = viewerParent.defaultZoom;
    var zoomRatio = defaultZoom / zoom;
    // this._attrs["font-size"] = fontSize * this._ratio * zoomRatio;
    this._attrs["font-size"] = fontSize * this._ratio;
}

/**
 * This function adds a textbox to the SVG group. It adds a foreignObject > div > textarea.
 * If an importedObj exists, the function replaces the foreign object with the foreign object
 * of imported annotation.
 * @param {*} groupId 
 * @param {*} importedObj - The foreign object from the imported annotation.
 * @returns 
 */
Text.prototype.addTextBox = function (groupId, importedObj) {

    // If a foreign object is to be imported from the loaded annotation
    if(importedObj != null){
        this.setForeignObj(importedObj);
        var pTag = this.createPTag(importedObj.childNodes[0]);
        importedObj.appendChild(pTag);
        group = document.getElementById(groupId);
        group.appendChild(importedObj);
        group.setAttribute("contentEditable", "true");
        return;
    }

    var svgForeignObj = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    var textOuterDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    var textInput = document.createElementNS("http://www.w3.org/1999/xhtml", "textarea");
    this.setForeignObj(svgForeignObj);
    
    fontSize = document.getElementsByClassName("fontInput")[0].value;
    this.calculateZoomRatio(fontSize);

    // // This would later need a unique ID for each text
    textInput.setAttribute("id", "textInput");
    textOuterDiv.setAttribute("contentEditable", "true");
    textInput.setAttribute("contentEditable", "true");
    textInput.style.color = this._attrs["stroke"];
    svgForeignObj.setAttribute("contentEditable", "true");
    textOuterDiv.setAttribute("width", "auto");
    textOuterDiv.setAttribute("tabindex", "-1");
    svgForeignObj.setAttribute("width", "100%");
    // svgForeignObj.setAttribute("height", "1000px");
    svgForeignObj.setAttribute("height", this._attrs["font-size"]*100 + "px");
    textOuterDiv.appendChild(textInput); 
    svgForeignObj.classList.add("foreign-object"); //to make div fit text
    textOuterDiv.classList.add("foreign-object-div"); //to make div fit text
    svgForeignObj.setAttribute("x", this._attrs["x"]);
    svgForeignObj.setAttribute("y", this._attrs["y"]);
    svgForeignObj.appendChild(textOuterDiv);

    group = document.getElementById(groupId);
    group.appendChild(svgForeignObj);
    group.setAttribute("contentEditable", "true");

    textInput.addEventListener("keydown", function (e) {
        prev = this.textHeight;
        this.style.height = (this.scrollHeight) + "px";
        this.textHeight = this.scrollHeight;
        textInput.innerHTML = textInput.value;
    });

    this.initResizeElement();
    this.initDragElement();
    // textInput.setAttribute("style", "height:" + this.textHeight + "px;overflow-y:hidden;");
    textInput.style.height = this.textHeight + "px";
    textInput.style.overflowY = "hidden";
    textInput.style.fontSize = this._attrs["font-size"] + "px";
    textOuterDiv.style.padding = this._attrs["font-size"] * 0.8 + "px";
    textOuterDiv.style.border = this._attrs["font-size"] * 0.25 + "px solid red";
    textInput.setAttribute("wrap", "hard");
}

// Function to chagne font size of the text
Text.prototype.changeFontSize = function (fontSize) {

    var foreignObj = this.getForeignObj();
    var divCont = foreignObj.childNodes[0];
    var textInput = divCont.childNodes[0];
    this.calculateZoomRatio(fontSize);
    textInput.style.fontSize = this._attrs["font-size"] + "px";
}

/**
 * This function is used to enable drag functionality on the text input
 */
Text.prototype.initDragElement = function () {

    pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    var foreignObj = this.getForeignObj();
    var divCont = foreignObj.childNodes[0];    
    var elmnt = null;
    var currentZIndex = 100;
    divCont.onmousedown = function() {
        this.style.zIndex = "" + ++currentZIndex;
    };

    divCont.onmousedown = dragMouseDown;
    divCont.onpointerdown = dragMouseDown;

    function dragMouseDown(e) {
        e.stopImmediatePropagation();
        elmnt = e.target;
        elmnt.style.zIndex = "" + ++currentZIndex;

        e = e || window.event;
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        divCont.onmouseup = closeDragElement;
        divCont.onpointerup = closeDragElement;
        divCont.onmouseleave = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        if (!elmnt) {
        return;
        }

        e = e || window.event;
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = elmnt.offsetTop - 60 * pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - 60 * pos1 + "px";
    }

    function closeDragElement(e) {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
        document.onpointerup = null;
    }

    function getHeader(element) {
        var headerItems = element.getElementsByClassName("move-header");

        if (headerItems.length === 1) {
            return headerItems[0];
        }

        return null;
    }
}

/**
 * This function enables the resizing functionality for the text input
 */
Text.prototype.initResizeElement = function () {

    // var divCont = document.getElementsByClassName("insideforeign")[0];
    var foreignObj = this.getForeignObj();
    var divCont = foreignObj.childNodes[0];
    var element = null;
    var startX, startY, startWidth, startHeight;
    
    bottomright = document.createElement("div");
    bottomright.className = "resizer-bottomright";
    divCont.appendChild(bottomright);
    bottomright.addEventListener("mousedown", initDrag, false);
    bottomright.parentPopup = divCont;
    bottomright.style.height = this._attrs["font-size"] + "px";
    bottomright.style.width = this._attrs["font-size"] + "px";
    bottomright.style["margin-left"] = this._attrs["font-size"] * 0.125 + "px";

    function initDrag(e) {
        e.stopImmediatePropagation();
        element = this.parentPopup;
        resizer = e.target.className;

        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(
        document.defaultView.getComputedStyle(element).width,
        10
        );
        startHeight = parseInt(
        document.defaultView.getComputedStyle(element).height,
        10
        );

        document.documentElement.addEventListener("mousemove", doDrag, false);
        document.documentElement.addEventListener("pointerup", stopDrag, false);
        document.documentElement.addEventListener("mouseup", stopDrag, false);
    }

    function doDrag(e) {
        e.stopImmediatePropagation();
        element.style.position = "absolute";
        switch(resizer) {
            case "resizer-bottomleft":
                element.style.width = startWidth + 60 * (e.clientX - startX)+ "px";
                element.style.left = startX + 60 * (startX - e.clientX) + "px";
                element.style.height = startHeight + 60 * (e.clientY - startY) + "px";
                break;
            case "resizer-topleft":
                element.style.width = startWidth + 60 * (startX - e.clientX)+ "px";
                element.style.left = startX + 60 * (e.clientX - startX) + "px";
                element.style.top = startY + 60 * (e.clientY - startY) + "px";
                element.style.height = startHeight + 60 * (startY - e.clientY) + "px";
                break;
            case "resizer-topright":
                element.style.width = startWidth + 60 * (e.clientX - startX) + "px";
                element.style.top = startY + 60 * (e.clientY - startY) + "px";
                element.style.height = startHeight + 60 * (startY - e.clientY) + "px";
                break;
            case "resizer-bottomright":
                element.style.width = startWidth + 30 * (e.clientX - startX) + "px";
                var textArea = divCont.getElementsByTagName("textarea")[0];
                textArea.style.height = "1px";
                textArea.style.height = textArea.scrollHeight + "px";
                break;
            default:
                break;
        }
    }

    function stopDrag() {
        document.documentElement.removeEventListener("mousemove", doDrag, false);
        document.documentElement.removeEventListener("pointerup", stopDrag, false);
        document.documentElement.removeEventListener("mouseup", stopDrag, false);
    }
}


Text.prototype.updateTextColor = function (newColor) {

    var text = this.getForeignObj().getElementsByTagName("p")[0];
    text.style.color = newColor;
}

Text.prototype.highlight = function () {

    var foreignObj = this.getForeignObj();
    var text = foreignObj.getElementsByTagName("p")[0];
    text.style.fontWeight = "900";
}

Text.prototype.unHighlight = function () {

    var foreignObj = this.getForeignObj();
    var text = foreignObj.getElementsByTagName("p")[0];
    text.style.fontWeight = "400";
}