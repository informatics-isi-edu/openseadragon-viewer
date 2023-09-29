function Text(attrs) {

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "text";
    this._attrs["x"] = (attrs["x"] / 2);
    this._attrs["y"] = (attrs["y"] / 2);
    this._attrs["stroke"] = attrs["stroke"] || "red";
    this.annotationUtils = new AnnotationUtils();


    /* Calculate the ratio for the mapping from image to screen size
    * We use the OSD viewer container size and the actual image size to calculate the ratio
    * This ratio will be used to obtain the font size of the text annotation that appears similar
    * to the font size on user's screen.
    * Formula: mappingRatio = max(imageWidth/containerWidth, imageHeight/containerHeight)
    */
    var viewerParent = this.parent.parent.parent;
    var containerSize = viewerParent.osd.viewport.containerSize;
    this._ratio = Math.max(attrs["x"]/containerSize.x, attrs["y"]/containerSize.y);

    this._attrs["font-size"] = attrs["font-size"] || this._ratio * 14;
    this._attrs["font-weight"] = attrs["font-weight"] || 400;
    this.svg = null;

    // Foreign object that contains the annotation input and transformed text p tag
    this.foreignObj = null;

    /**
     * whether user is actively resizing the textbox or not.
     * if they are, we should avoid moving it at the same time.
     */
    this.isResizing = false;
}

Text.prototype = Object.create(Base.prototype);
Text.prototype.constructor = Text;

Text.prototype.setForeignObj = function(obj) {
    this.foreignObj = obj;
}

Text.prototype.getForeignObj = function() {
    return this.foreignObj;
}

Text.prototype.renderSVG = function () {
    // We do not need to render the text tag for the text annotation
    // since we are using the foreign object to render the text input
    // and the transformed text p tag
    return;
}


/**
 * This function is used to place the annotation at the desired position when user clicks on the OSD canvas
 * @param {Array} point - The x and y coordinates of the point are used to position the annotation
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
 * or will just remove the foreignObject is the textarea is empty.
 */
Text.prototype.transform = function () {

    var foreignObj = this.getForeignObj();
    var div = foreignObj.childNodes[0];
    const hasValue = div && div.childNodes[0] && div.childNodes[0].value && div.childNodes[0].value.trim() != "";

    // if the textarea is empty, just remove the foreignObject
    if (!hasValue) {
        foreignObj.parentNode.removeChild(foreignObj);
    }
    // Transform only if the input is not empty
    else {
        var textInput = div.childNodes[0];
        var pText = this.createPTag(textInput);

        var h = div.style.marginTop;
        var w = div.style.marginLeft;

        foreignObj.setAttribute('width', pText.style.width);
        foreignObj.setAttribute('height', pText.style.height);

        var divPadding = window.getComputedStyle(div, null).getPropertyValue('padding');
        // We obtain the padding and border of the div element to position the p tag correctly
        // Both properties have been defined in pixels while creating the textarea
        divPadding = parseInt(divPadding.slice(0, divPadding.length - 2)) || 0;
        var divBorder = window.getComputedStyle(div, null).getPropertyValue('border').split(" ")[0];
        divBorder = parseInt(divBorder.slice(0, divBorder.length - 2)) || 0;
        if(h) {
            h = parseInt(h.slice(0, h.length - 2))
        } else {
            h = 0;
        }
        if(w) {
            w = parseInt(w.slice(0, w.length - 2))
        } else {
            w = 0;
        }
        /* We calculate the new position x and y of the transformed text p tag by taking into
        * consideration the padding and border of the div element and the width and height of the textarea.
        * The code calculates the new position of text in a draggable div after transformation by considering previous width,
        * padding, and border attributes. This is necessary because the position before transformation differs from the actual
        * placement after transformation.
        */
        foreignObj.setAttribute("x",  w + divPadding + divBorder);
        foreignObj.setAttribute("y", h + divPadding + divBorder);
        foreignObj.setAttribute("tabindex", -1);
        foreignObj.innerHTML = "";
        foreignObj.appendChild(pText);
        pText.style.height = "fit-content";
        pText.style.width = "fit-content";
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

    /**
     * make sure the content of p tag stays withing the width, the same as textarea
     */
    pText.style.overflowWrap = "anywhere";

    /**
     * Replace all the new line characters with <br> tag to preserve the formatting
     * this will make sure we're supporting multiple consecutive newlines
     */
    pText.style.whiteSpace = "pre-wrap";
    inputValue = inputValue.replace(/\n/g, "<br />");
    pText.innerHTML = inputValue;

    var styleObj = this.annotationUtils.styleStringToObject(originalObj.getAttribute("style"));
    pText.style.fontSize = styleObj["font-size"];
    pText.style.height = styleObj["height"];
    pText.style.width = (originalObj.clientWidth || originalObj.width) + "px";
    // Copy the font color of the textarea to the p tag
    pText.style.color = styleObj["color"];
    // Adding the text-hover class to the p tag for the hover effect to highlight the text
    pText.classList.add("text-hover");

    // Override the default base.js event handlers for the text annotation
    // Text annotation does not have a d3 element, so we need to add the event handlers
    // that work without the d3 element
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

/**
 * This function is used to remove the text annotation from the OSD canvas
 * and also remove the event listeners attached to the <p> tag.
 */
Text.prototype.removeText = function () {

    var foreignObj = this.getForeignObj();
    if(foreignObj == null) return;
    var pText = foreignObj.querySelector("p");
    if(pText != null){
        pText.removeEventListener("click", this.onClickToSelectAnnotation);
        pText.removeEventListener("mouseover", this.onMouseoverShowTooltip);
        pText.removeEventListener("mouseout", this.onMouseoutHideTooltip);
    }
    if(foreignObj.parentNode != null) {
        foreignObj.parentNode.removeChild(foreignObj);
    }
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
    if(importedObj != null) {

        var styleObj = this.annotationUtils.styleStringToObject(importedObj.getAttribute("style"));

        if (styleObj) {
            // Initialize the style of imported object
            importedObj.style = {};

            for(var key in styleObj) {
                importedObj.style[key] = styleObj[key];
            }
        }

        // Assign all the attributes to the imported object
        for(var i = 0; i < importedObj.attributes.length; i++) {
            var attr = importedObj.attributes[i];
            importedObj.setAttribute(attr.name, attr.value);
        }

        // this is hacky but I couldn't come up with a better way
        // the parseSVGNodes is adding an id that we shouldn't attach to foreignObject
        importedObj.removeAttribute('id');

        this.setForeignObj(importedObj);
        var pTag = this.createPTag(importedObj.childNodes[0]);
        // Remove the p tag in the import foreign object and add the new p tag
        // with the added functionality
        importedObj.innerHTML = "";
        importedObj.appendChild(pTag);
        var group = document.getElementById(groupId);
        group.appendChild(importedObj);
        group.setAttribute("contentEditable", "true");
        return;
    }

    var svgForeignObj = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    var textOuterDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    var textInput = document.createElementNS("http://www.w3.org/1999/xhtml", "textarea");
    this.setForeignObj(svgForeignObj);

    fontSize = document.querySelector(".fontInput").value;
    this.changeFontSize(fontSize);

    // Set the attributes of the foreign object, div and textarea
    textInput.setAttribute("class", "text-foreign-object-input");
    // Make the text area editable inside the foreign object in SVG by setting the contentEditable attribute
    textOuterDiv.setAttribute("contentEditable", "true");
    textInput.setAttribute("contentEditable", "true");
    svgForeignObj.setAttribute("contentEditable", "true");
    svgForeignObj.setAttribute("stroke", this._attrs["stroke"]);
    // Set the font color same as the stroke color
    textInput.style.color = this._attrs["stroke"];
    textOuterDiv.setAttribute("width", "auto");
    textOuterDiv.setAttribute("tabindex", "-1");
    svgForeignObj.setAttribute("width", "100%");
    // Set the height of the foreign object to be 100 times the font size
    // This would later adjust according the font size of the text
    svgForeignObj.setAttribute("height", this._attrs["font-size"] * 100 + "px");
    textOuterDiv.appendChild(textInput);
    // Add the classes to the foreign object and the div for styling
    // that handles the text wrapping and resizing and other styling
    svgForeignObj.classList.add("text-foreign-object");
    textOuterDiv.classList.add("text-foreign-object-div");

    // Set the position of the foreign object
    svgForeignObj.setAttribute("x", 0);
    svgForeignObj.setAttribute("y", 0);
    textOuterDiv.style.marginLeft = this._attrs["x"] + "px";
    textOuterDiv.style.marginTop = this._attrs["y"] + "px";

    svgForeignObj.appendChild(textOuterDiv);

    var group = document.getElementById(groupId);
    group.appendChild(svgForeignObj);
    group.setAttribute("contentEditable", "true");

    /**
     * Add event listeners to the textarea for input
     * - update the the height
     */
    textInput.addEventListener("keydown", function (e) {
        prev = this.textHeight;
        this.style.height = (this.scrollHeight) + "px";
        this.textHeight = this.scrollHeight;
        textInput.innerHTML = textInput.value;
    });

    /*
    * Safari does not support the absolute positioning property on the div inside the foregin object.
    * If we set it to absolute, the foreign object will not be visible.
    * Setting the absolute positioning is crucial for the positioning of the resize control on border.
    * So, we are only setting the position absolute and adding the resize control for browsers other than Safari for now.
    * This is a temporary fix and we need to find a better solution for this.
    */
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if(!isSafari) {
        textOuterDiv.style.position = "absolute";
        this.initResizeElement();
    }
    this.initDragElement();

    textInput.style.height = this.textHeight + "px";
    textInput.style.overflowY = "hidden";
    textInput.style.fontSize = this._attrs["font-size"] + "px";
    /* Set the border and padding of the div oustide the textarea
    * to create area for dragging the text annotation.
    * The padding is set to 4 times the stroke width to create a draggable area for the div
    */
    textOuterDiv.style.padding = (this.parent.getStrokeScale() * this._ratio * 4) + "px";
    textOuterDiv.style.borderWidth = (this.parent.getStrokeScale() * this._ratio) + "px";
    textOuterDiv.style.borderStyle = "solid";
    textOuterDiv.style.borderColor = this._attrs["stroke"];
    textInput.setAttribute("wrap", "hard");
}

/**
 * This function is used to change the font size of the text input
 * @param {*} fontSize - This is the new font size
 * @returns
 */
Text.prototype.changeFontSize = function (fontSize) {

    this._attrs["font-size"] = this._ratio * fontSize;

    var foreignObj = this.getForeignObj();
    var divCont = foreignObj.childNodes[0];
    if(divCont == null) return;
    var textInput = divCont.childNodes[0];
    textInput.style.fontSize = this._ratio * fontSize + "px";
    textInput.style.height = "1px";
    textInput.style.height = textInput.scrollHeight + "px";

    // update the size of resize button
    const bottomright = document.querySelector('.text-foreign-object-resizer-right');
    if (bottomright) {
        bottomright.style.height = this._attrs["font-size"] + "px";
        bottomright.style.width = this._attrs["font-size"] + "px";
    }
}

/*
 * This function is used to enable drag functionality on the text input
 */
Text.prototype.initDragElement = function () {

    pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    var foreignObj = this.getForeignObj();
    var divCont = foreignObj.childNodes[0];
    var currentZIndex = 100;
    var _self = this;

    // TODO review this logic
    divCont.onmousedown = function() {
        this.style.zIndex = "" + ++currentZIndex;
    };

    divCont.onmousedown = dragMouseDown;
    divCont.onpointerdown = dragMouseDown;

    // This function is called when the user clicks to start dragging the element
    function dragMouseDown(e) {
        e.stopImmediatePropagation();
        divCont.style.zIndex = "" + ++currentZIndex;

        e = e || window.event;
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;

        /**
         * we have to add this event to the whole page and not the div.
         * this way even if the cursor goes outside the div it's still considered a valid drag. we should only stop the
         * drag when users actaully stops dragging (regardles of where the cursor is)
         */
        document.addEventListener('pointerup', closeDragElement);

        // handle dragging
        document.addEventListener('pointermove', elementDrag);
    }

    // This function is called when the user drags the element
    function elementDrag(e) {
        // if we're already resizing, don't move the element
        if (_self.isResizing) return;

        e = e || window.event;
        // Calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position:
        divCont.style.marginLeft = divCont.offsetLeft - _self._ratio * pos1 + "px";
        divCont.style.marginTop = divCont.offsetTop - _self._ratio * pos2 + "px";
    }

    // This function is called when the user stops dragging the element
    function closeDragElement(e) {
        document.removeEventListener('pointerup', closeDragElement);
        document.removeEventListener('pointermove', elementDrag);
    }
}

/**
 * This function enables the resizing functionality for the text input
 */
Text.prototype.initResizeElement = function () {
    const _self = this;
    const foreignObj = this.getForeignObj();
    const divCont = foreignObj.childNodes[0];
    var startX, startY, startWidth, startHeight;

    // Create the resize element for the text input
    bottomright = document.createElement("div");
    bottomright.className = "text-foreign-object-resizer-right";
    divCont.appendChild(bottomright);

    // Add event listeners to the resize element
    bottomright.addEventListener("mousedown", initDrag, false);
    // bottomright.parentPopup = divCont;
    bottomright.style.height = this._attrs["font-size"] + "px";
    bottomright.style.width = this._attrs["font-size"] + "px";
    bottomright.style.backgroundColor = this._attrs["stroke"];
    // To position the resize element exactly on the right border, we need to add a margin of 1/8th of the font size
    // to the left of the element, since the padding of the div is 4 times the stroke width
    bottomright.style["margin-left"] = this._attrs["font-size"] * 0.125 + "px";

    // Function to intialize the resize movement of the text input
    function initDrag(e) {
        e.stopImmediatePropagation();
        resizer = e.target.className;

        startX = e.clientX;
        startY = e.clientY;
        // Get the current width and height of the text input
        startWidth = parseInt(document.defaultView.getComputedStyle(divCont).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(divCont).height, 10);

        document.documentElement.addEventListener("pointermove", doDrag, false);
        document.documentElement.addEventListener("pointerup", stopDrag, false);
    }

    // Function to change the size of the text input
    function doDrag(e) {
        e.stopImmediatePropagation();

        // signal that we're resizing
        _self.isResizing = true;

        divCont.style.position = "absolute";
        // Change the width of the text input based on the mouse movement
        divCont.style.width = startWidth + _self._ratio * (e.clientX - startX) + "px";
        var textArea = divCont.querySelector("textarea");
        textArea.style.height = "1px";
        textArea.style.height = textArea.scrollHeight + "px";

    }

    // Function to stop the resize movement of the text input
    function stopDrag() {
        // signal that resizing has finished
        _self.isResizing = false;

        document.documentElement.removeEventListener("pointermove", doDrag, false);
        document.documentElement.removeEventListener("pointerup", stopDrag, false);
    }
}

/**
 * Update the color of the text
 * @param {*} newColor - new color for the text
 */
Text.prototype.updateTextColor = function (newColor) {

    var foreignObj = this.getForeignObj();
    if(foreignObj == null) return;
    foreignObj.setAttribute("stroke", newColor);
    var text = this.getForeignObj().querySelector("p");
    if(text != null){
        text.style.color = newColor;
    }
}

/**
 * Highlight the text content
*/
Text.prototype.highlight = function () {

    var foreignObj = this.getForeignObj();
    if(foreignObj == null) return;
    var text = foreignObj.querySelector("p");
    if(text == null) return;
    text.style.fontWeight = "900";
}
/**
 * Unhighlight the text content
*/
Text.prototype.unHighlight = function () {

    var foreignObj = this.getForeignObj();
    if(foreignObj == null) return;
    var text = foreignObj.querySelector("p");
    if(text == null) return;
    text.style.fontWeight = "400";
}
