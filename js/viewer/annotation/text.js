function Text(attrs) {

    attrs = attrs ? attrs : {};
    Base.call(this, attrs);

    this._tag = "text";
    this._attrs["x"] = attrs["x"] || 18600;
    this._attrs["y"] = attrs["y"] || 19650;
    this._attrs["fill"] = attrs["fill"] || "red";
    this._attrs["font-size"] = attrs["font-size"] || 1000;
    this._attrs["font-weight"] = attrs["font-weight"] || 400;
    this.svg = null;
    this.foreignObj = "";

    this.setForeignObj = function(obj) {
        this.foreignObj = obj;
    }

    this.getForeignObj = function() {
        return this.foreignObj;
    }
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

// 
Text.prototype.transform = function () {

    this._attrs["id"] = "asdkfjaslkdfj";
    this._attrs["text"] = textInput.value;
    obj = this.getForeignObj();
    // this._attrs["x"] = window.scrollX + rect.left;
    // this._attrs["y"] = window.scrollY + rect.top;
    obj.parentNode.removeChild(obj);
    // console.log(textOuterDiv);
    // svgForeignObj.parentNode.removeChild(svgForeignObj);
    this.renderSVG();
    // document.getElementById("asdkfjaslkdfj").textContent = "AKSDFASKDJF";
    // document.getElementById("asdkfjaslkdfj").style["font-size"] = 2000;
}

/**
     * This function will add a textbox div to the SVG. This will be used to edit the text and would be later moved to the text.js 
     * once the feature to switch to and fro from text is implemented.
     */
    Text.prototype.addTextBox = function (groupId, textValue) {

        var svgForeignObj = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
        var textOuterDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
        var textInput = document.createElementNS("http://www.w3.org/1999/xhtml", "textarea");
        var prev = null;
        // textInput.style.color = "#0000ff";
        this.setForeignObj(svgForeignObj);

        // This would later need a unique ID for each text
        textInput.setAttribute("id", "textInput");
        
        // textInput.oninput = function(e) {
        //     e.stopImmediatePropagation();
        // };
        // textInput.onpointerdown = function(evt) {
        //     evt.stopImmediatePropagation();
        // };
        // textInput.keydown = function(evt) {
        //     evt.stopImmediatePropagation();
        // };
        // textInput.keyup = function(evt) {
        //     evt.stopImmediatePropagation();
        // };
        
        textOuterDiv.setAttribute("contentEditable", "true");
        textInput.setAttribute("contentEditable", "true");
        svgForeignObj.setAttribute("contentEditable", "true");
        textOuterDiv.setAttribute("width", "auto");
        textOuterDiv.setAttribute("tabindex", "-1");
        svgForeignObj.setAttribute("width", "100%");
        svgForeignObj.setAttribute("height", "1000px");
        textOuterDiv.appendChild(textInput); 
        svgForeignObj.classList.add("foreign"); //to make div fit text
        textOuterDiv.classList.add("insideforeign"); //to make div fit text

        // This would need to take the value from the click trackers of OSD to decide the position of the text.
        svgForeignObj.setAttributeNS(null, "transform", "translate(18000 18000)");
        svgForeignObj.appendChild(textOuterDiv);

        group = document.getElementById(groupId);
        group.appendChild(svgForeignObj);
        group.setAttribute("contentEditable", "true");

        if(textValue != null){
            textInput.value = textValue;
            textInput.innerHTML = textValue;
        }

        textInput.addEventListener("keydown", function (e) {
            // e.stopImmediatePropagation();
            prev = this.textHeight;
            this.style.height = (this.scrollHeight) + "px";
            this.textHeight = this.scrollHeight;
            textInput.innerHTML = textInput.value;
        });

        this.initResizeElement();
        this.initDragElement();

        textInput.setAttribute("style", "height:" + this.textHeight + "px;overflow-y:hidden;color:blue;");
        textInput.style.fontSize = "1000px";
        textInput.setAttribute("wrap", "hard");
    }

    Text.prototype.initDragElement = function () {
  
        pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
        var divCont = document.getElementsByClassName("insideforeign")[0];
        var elmnt = null;
        var currentZIndex = 100;
        divCont.onmousedown = function() {
            this.style.zIndex = "" + ++currentZIndex;
        };

            divCont.onmousedown = dragMouseDown;
            divCont.onpointerdown = dragMouseDown;

        function dragMouseDown(e) {
            e.stopImmediatePropagation();
            console.log(e);
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

    // This function would be used to add the resizing functionality to the text box. This would need to be executed for every text
    Text.prototype.initResizeElement = function () {

        var divCont = document.getElementsByClassName("insideforeign")[0];
        // console.log(divCont.getElementsByTagName("textarea").style.height);
        // var height = textheight.style.split(";")[0];
        // height = height.slice(8, height.length - 2);
        var element = null;
        var startX, startY, startWidth, startHeight;

        // Creating the four corners for resizing

        // topleft = document.createElement("div");
        // topleft.className = "resizer-topleft";
        // divCont.appendChild(topleft);
        // topleft.addEventListener("pointerdown", initDrag, false);
        // topleft.parentPopup = divCont;
    
        // bottomleft = document.createElement("div");
        // bottomleft.className = "resizer-bottomleft";
        // divCont.appendChild(bottomleft);
        // bottomleft.addEventListener("pointerdown", initDrag, false);
        // bottomleft.parentPopup = divCont;
  
        // topright = document.createElement("div");
        // topright.className = "resizer-topright";
        // divCont.appendChild(topright);
        // topright.addEventListener("pointerdown", initDrag, false);
        // topright.parentPopup = divCont;
        
        bottomright = document.createElement("div");
        bottomright.className = "resizer-bottomright";
        divCont.appendChild(bottomright);
        bottomright.addEventListener("pointerdown", initDrag, false);
        bottomright.parentPopup = divCont;

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
            element.style.position = "absolute";
            switch(resizer) {
                case "resizer-bottomleft":
                    element.style.width = startWidth + 60 * (e.clientX - startX)+ "px";
                    element.style.left = startX + 60 * (startX - e.clientX) + "px";
                    element.style.height = startHeight + 60 * (e.clientY - startY) + "px";
                    console.log(element.style.left);
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
                    element.style.width = startWidth + 60 * (e.clientX - startX) + "px";
                    // element.style.height = (element.scrollHeight) + "px";
                    // element.textHeight = element.scrollHeight;
                    var textheight = divCont.getElementsByTagName("textarea")[0].offsetHeight;
                    console.log(textheight);
                    h = startHeight + 60 * (e.clientY - startY) + "px";
                    if(h > textheight){
                        element.style.height = h;
                    }
                    else{
                        element.style.height = textheight;
                    }
                    break;
                default:
                    break;
            }
            // element.style.width = startWidth + 60 * (e.clientX - startX) + "px";
            // element.style.height = startHeight + 60 * (e.clientY - startY) + "px";
        }

        function stopDrag() {
            console.log("Stopping drag");
            document.documentElement.removeEventListener("mousemove", doDrag, false);
            document.documentElement.removeEventListener("pointerup", stopDrag, false);
            document.documentElement.removeEventListener("mouseup", stopDrag, false);
        }
    }