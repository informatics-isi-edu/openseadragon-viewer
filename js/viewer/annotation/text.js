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
    /**
     * We do not need to render the text tag for the text annotation
     * since we are using the foreign object to render the text input
     * and the transformed text p tag
     */
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
    /**
     * Locate the wrapper and input by class rather than child index: nested
     * contenteditable elements get browser-injected placeholder/<br> nodes on
     * focus that shift childNodes[0], which previously made hasValue false and
     * silently deleted the user's text on finalize.
     */
    var div = foreignObj.querySelector(".text-foreign-object-div");
    var textInput = foreignObj.querySelector(".text-foreign-object-input");
    const hasValue = textInput && textInput.innerText && textInput.innerText.trim() != "";

    // if the input field is empty, just remove the foreignObject
    if (!hasValue) {
        foreignObj.parentNode.removeChild(foreignObj);
    }
    else {
        var pText = this.createPTag(textInput, true);

        var h = div.style.marginTop;
        var w = div.style.marginLeft;

        var divPadding = window.getComputedStyle(div, null).getPropertyValue('padding');
        // padding and border (defined in px when the input was created) position the p tag correctly
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
        /* Recompute the p tag's x/y, accounting for the div's previous width, padding,
        * and border — placement before the transform differs from the actual placement after.
        */
        foreignObj.setAttribute("x",  w + divPadding + divBorder);
        foreignObj.setAttribute("y", h + divPadding + divBorder);
        foreignObj.setAttribute("tabindex", -1);
        foreignObj.innerHTML = "";
        foreignObj.appendChild(pText);

        /**
         * Size the foreignObject to fit pText exactly, measuring after it's in the DOM
         * (so layout reflects the real <p>). offsetWidth/Height ignore CSS transforms —
         * getBoundingClientRect would return a rotated AABB at non-zero viewport rotation.
         * They floor to integers, so +1 covers the sub-pixel rounding.
         */
        pText.style.width = "max-content";
        pText.style.height = "auto";
        foreignObj.setAttribute('width', (pText.offsetWidth + 1) + 'px');
        foreignObj.setAttribute('height', (pText.offsetHeight + 1) + 'px');
        pText.style.height = "fit-content";
        pText.style.width = "fit-content";

        /**
         * Carry over the counter-rotation that kept the editable wrapper upright.
         * Without this, the freshly finalized <p> would briefly show rotated until
         * the next resizeSVG/animation event runs.
         */
        var viewerParent = this.parent.parent.parent;
        var rotation = viewerParent.osd.viewport.getRotation();
        pText.style.transformOrigin = "0 0";
        pText.style.transform = "rotate(" + (-rotation) + "deg)";
    }
}

/**
 * This function creates a <p> tag to be appended as a child to the foreign object.
 * @param {*} originalObj - This object is the original object that is to be replaced by the p tag.
 * The object will be a <textarea> while switching annotation tool and <p> tag from the SVG namespace
 * while importing annotations.
 * @param {boolean} isTextArea - whether this is from text area, or it's from the already saved SVG.
 * @returns <p> tag HTML element
 */
Text.prototype.createPTag = function (originalObj, isTextArea) {

    var _self = this;
    var pText = document.createElement("p");
    /**
     * Live editor is a contenteditable <div>: read innerText for plain text, avoiding
     * browser-injected markup. Imported/saved annotations are already a <p>, so read innerHTML.
     */
    var inputValue = isTextArea ? originalObj.innerText : originalObj.innerHTML;

    // keep the p tag content within its width, like the textarea
    pText.style.overflowWrap = "anywhere";

    // pre-wrap preserves newlines (including consecutive ones) without needing <br> tags
    pText.style.whiteSpace = "pre-wrap";

    /**
     * Live editor: assign plain text via textContent. innerHTML would interpret HTML-like
     * characters the user typed (e.g. "<img onerror=...>") as markup, corrupting the
     * exported SVG and opening a DOM injection/XSS hole; pre-wrap still preserves newlines.
     * Imported/saved is already real markup (<br>, etc.), so keep innerHTML.
     *
     * We deliberately do NOT convert "\n" to <br> (commented line below): unnecessary with
     * pre-wrap, and it throws in firefox on re-showing a saved SVG because outerHTML emits
     * non-XHTML "<br>" that base.js would then have to rewrite to "<br \/>" before export.
     */
    // inputValue = inputValue.replace(/\n/g, "<br \/>");
    if (isTextArea) {
        pText.textContent = inputValue;
    } else {
        pText.innerHTML = inputValue;
    }

    var styleObj = this.annotationUtils.styleStringToObject(originalObj.getAttribute("style"));
    pText.style.fontSize = styleObj["font-size"];

    /**
     * Saved svg: use fit-content for width/height (the foreignObject holds the real values,
     * so hover works). Textarea: honor the given width; adjusted later when positioning the
     * foreignObject.
     */
    pText.style.height = isTextArea ? styleObj["height"] : 'fit-content';
    pText.style.width = isTextArea ? ((originalObj.clientWidth || originalObj.width) + "px") : 'fit-content';

    // Copy the font color of the textarea to the p tag
    pText.style.color = styleObj["color"];

    /**
     * For imported (saved) text, preserve the rotation baked in at finalize time.
     * transform() applies `rotate(-R0)` to the <p> at finalize, so later viewport
     * rotation shows (R - R0) — the text is "stickied" to the image's orientation at
     * creation. Without copying it here, reload paths drop the transform and the text
     * appears un-rotated. The live finalize path doesn't need this; transform() applies
     * the transform itself after createPTag returns.
     */
    if (!isTextArea) {
        if (styleObj["transform"]) {
            pText.style.transform = styleObj["transform"];
        }
        if (styleObj["transform-origin"]) {
            pText.style.transformOrigin = styleObj["transform-origin"];
        }
    }

    // Adding the text-hover class to the p tag for the hover effect to highlight the text
    pText.classList.add("text-hover");

    /**
     * Override the default base.js event handlers for the text annotation.
     * Text annotation does not have a d3 element, so we need to add the event handlers
     * that work without the d3 element.
     */
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
            // intentionally left empty — just prevents the default zoom behavior
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
        var pTag = this.createPTag(importedObj.querySelector('p'), false);
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
    /**
     * Use a contenteditable <div> (not <textarea>) for the input. Native form widgets
     * like <textarea> bypass CSS transforms on ancestor SVGs, so the text wouldn't rotate
     * with the annotation overlay when the viewport is rotated. A plain <div> is a regular
     * DOM node and follows the parent .annotationSVG's CSS transform correctly.
     */
    var textInput = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    this.setForeignObj(svgForeignObj);

    fontSize = document.querySelector(".fontInput").value;
    this.changeFontSize(fontSize);

    // Set the attributes of the foreign object, div and textarea
    textInput.setAttribute("class", "text-foreign-object-input");
    /**
     * Only the inner input div is editable. When textOuterDiv and the foreignObject were
     * also contentEditable, clicks in their padding/border typed text outside the styled
     * input (no font-size / color inherited). With only textInput editable, focus always
     * lands in the input wherever the user clicks within the wrapper.
     */
    textInput.setAttribute("contentEditable", "true");
    svgForeignObj.setAttribute("stroke", this._attrs["stroke"]);
    // Set the font color same as the stroke color
    textInput.style.color = this._attrs["stroke"];
    textOuterDiv.setAttribute("width", "auto");
    textOuterDiv.setAttribute("tabindex", "-1");
    svgForeignObj.setAttribute("width", "100%");
    // height starts at 100× the font size; adjusted later to the actual text
    svgForeignObj.setAttribute("height", this._attrs["font-size"] * 100 + "px");
    textOuterDiv.appendChild(textInput);
    // classes that handle text wrapping, resizing, and other styling
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
     * Auto-resize the input to fit its content as the user types. The `input` event fires
     * after the keystroke is applied (unlike `keydown`), so scrollHeight is accurate here.
     */
    textInput.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
        this.textHeight = this.scrollHeight;
    });

    /*
    * Safari doesn't support absolute positioning on the div inside the foreignObject (it
    * makes the foreignObject invisible), but absolute positioning is needed to place the
    * resize control on the border. So we only set it and add the resize control on
    * non-Safari browsers for now. Temporary fix; needs a better solution.
    */
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if(!isSafari) {
        textOuterDiv.style.position = "absolute";
        this.initResizeElement();
    }
    this.initDragElement();

    /**
     * A <textarea> has an intrinsic one-row height; an empty <div> collapses to zero, so
     * there'd be no visible area to click into. Initialize textHeight to one line
     * (font-size × line-height) so the input shows immediately and descenders ('p', 'g')
     * aren't clipped.
     */
    var lineHeight = 1.4;
    var oneLineHeight = this._attrs["font-size"] * lineHeight;
    if (!this.textHeight) {
        this.textHeight = oneLineHeight;
    }
    textInput.style.height = this.textHeight + "px";
    textInput.style.minHeight = oneLineHeight + "px";
    textInput.style.lineHeight = lineHeight;
    textInput.style.fontSize = this._attrs["font-size"] + "px";
    // suppress the contenteditable focus ring; textOuterDiv's border already signals the active annotation
    textInput.style.outline = "none";
    textInput.style.whiteSpace = "pre-wrap";
    textInput.style.wordBreak = "break-word";
    textInput.style.cursor = "text";
    // don't constrain overflow; auto-resize keeps it at content height and clipping would hide descenders
    textInput.style.overflow = "visible";
    /* border and padding on the outer div create a draggable area around the text;
    * padding is 4× the stroke width.
    */
    textOuterDiv.style.padding = (this.parent.getStrokeScale() * this._ratio * 4) + "px";
    textOuterDiv.style.borderWidth = (this.parent.getStrokeScale() * this._ratio) + "px";
    textOuterDiv.style.borderStyle = "solid";
    textOuterDiv.style.borderColor = this._attrs["stroke"];

    /**
     * Counter-rotate the wrapper so the text reads upright regardless of viewport rotation.
     * resizeSVG also applies this on every rotation change; doing it here makes the first
     * paint correct (before any animation event fires).
     *
     * The pivot is the text content's top-left, offset by (padding + border) inward from
     * textOuterDiv's top-left. After finalize the <p> sits at that offset point (the
     * foreignObject moves to absorb it), so keeping the pivot at the same screen location
     * across edit/finalize avoids a position jump when the user clicks away to commit.
     */
    var viewerParent = this.parent.parent.parent;
    var initialRotation = viewerParent.osd.viewport.getRotation();
    var paddingPx = this.parent.getStrokeScale() * this._ratio * 4;
    var borderPx = this.parent.getStrokeScale() * this._ratio;
    var pivotOffset = paddingPx + borderPx;
    textOuterDiv.style.transformOrigin = pivotOffset + "px " + pivotOffset + "px";
    textOuterDiv.style.transform = "rotate(" + (-initialRotation) + "deg)";

    /**
     * Focus the input so the user can type without a second click. Defer to the next tick
     * so the element is fully in the DOM (focus() on a detached element is a no-op in some browsers).
     */
    setTimeout(function () { textInput.focus(); }, 0);
}

/**
 * This function is used to change the font size of the text input
 * @param {*} fontSize - This is the new font size
 * @returns
 */
Text.prototype.changeFontSize = function (fontSize) {

    this._attrs["font-size"] = this._ratio * fontSize;

    var foreignObj = this.getForeignObj();
    if (!foreignObj) return;
    /**
     * Locate the input by class rather than child index: nested contenteditable elements
     * get browser-injected placeholder/<br> nodes on focus that knock childNodes[0] off.
     */
    var textInput = foreignObj.querySelector(".text-foreign-object-input");
    if (!textInput || !textInput.style) return;
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
         * Attach to the whole page, not the div, so the drag stays valid even when the
         * cursor leaves the div; we only stop when the user actually stops dragging.
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

        // Screen-space drag delta (positive = pointer moved right/down).
        var deltaScreenX = -pos1;
        var deltaScreenY = -pos2;

        /**
         * The margin (marginLeft/marginTop) is in the SVG's local coords, rotated by R
         * relative to the screen. Rotate the screen-space delta by -R into margin-space so
         * the text follows the pointer; without this a right-drag at R=90 moves it down.
         */
        var rotation = _self.parent.parent.parent.osd.viewport.getRotation();
        var rad = rotation * Math.PI / 180;
        var cosR = Math.cos(rad);
        var sinR = Math.sin(rad);
        var deltaMarginX =  cosR * deltaScreenX + sinR * deltaScreenY;
        var deltaMarginY = -sinR * deltaScreenX + cosR * deltaScreenY;

        // Set the element's new position:
        divCont.style.marginLeft = (divCont.offsetLeft + _self._ratio * deltaMarginX) + "px";
        divCont.style.marginTop  = (divCont.offsetTop  + _self._ratio * deltaMarginY) + "px";
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
    // nudge the resizer onto the right border with a left margin of 1/8 the font size (the div's padding is 4× the stroke width)
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
        // match the input by class (it's a contenteditable <div> now, formerly a <textarea>)
        var textArea = divCont.querySelector(".text-foreign-object-input");
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
