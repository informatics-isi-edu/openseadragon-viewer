function AnnotationTool(parent){

    var _self = this;

    this.elem = null;
    this.parent = parent || null;
    this.isDisplay = false;
    this.curType = 'CURSOR';
    this.curSubtype = '';
    this.curSVGID = '';
    this.curGroupID = '';
    this.curStroke = '#f00000';

    // Dispatch the event to the parent
    this.dispatchEvent = function(type, data){
        switch(type){
            default:
                this.parent.dispatchEvent(type, data);
                break;
        }
    }

    // Click to change annotation button
    this.onClickChangeBtn = function(){
        var btnType = this.getAttribute("data-type") || "";
        var btnSubtype = null;
        if(btnType === "ARROWLINE"){
            btnSubtype = "solid";
        }

        // Function call to handle special functions for different annotation types
        _self.handleAnnotationFunctions(btnType, btnSubtype);

        if (btnType == "HELP") {
            _self.dispatchEvent('openDrawingHelpPage');
            return;
        }

        if(_self.curType == btnType){
            if (btnType == 'CURSOR') {
                // we dont want to do anything if the cursor is clicked again
                return;
            }
            btnType = 'CURSOR';
        }

        _self.dispatchEvent("drawingStop");
        _self.updateMode(btnType, btnSubtype);

    }

    // Change stroke color. This function handles the flow when the color (stroke) is changed while drawing/editting the SVG.
    this.onChangeStrokeColor = function(){
        _self.curStroke = this.value;
        _self.dispatchEvent("drawingStrokeChanged", {
            svgID: _self.curSVGID,
            groupID: _self.curGroupID,
            type: _self.curType,
            attrs: {
                "stroke": _self.curStroke,
                "fill": "None"
            }
        });
    }

    // Render the view
    this.render = function(data){

        var toolElem = null,
            colorInput = null;
            _self = this;

        if(!this.elem){
            toolElem = document.createElement("div");
            toolElem.setAttribute("class", "annotationTool flex-col");
            toolElem.innerHTML = [
                "<span class='toolBtn' data-type='CURSOR' data-toggle='tooltip' data-placement='right' title='Tooltip on right'>",
                    "<i class='fa fa-mouse-pointer'></i>",
                "</span>",
                "<span class='toolBtn' data-type='CHANGE_COLOR' title='Change Color'>",
                    "<input type='color' value='" + _self.curStroke + "' id='strokeColor'/>",
                "</span>",
                "<span class='toolBtn' data-type='PATH' title='Draw path'>",
                    "<i class='fas fa-pencil-alt'></i>",
                "</span>",
                "<span class='toolBtn' data-type='RECT' title='Draw rectangle'>",
                    "<i class='fa fa-square'></i>",
                "</span>",
                "<span class='toolBtn' data-type='CIRCLE' title='Draw circle'>",
                    "<i class='fa fa-circle'></i>",
                "</span>",
                "<span class='toolBtn' data-type='LINE' title='Draw line'>",
                    "<i class='fa fa-minus'></i>",
                "</span>",
                "<span class='toolBtn' data-type='ARROWLINE' title='Draw arrow line'>",
                    "<i class='fas fa-long-arrow-alt-right'></i>",
                "</span>",
                "<span class='toolBtn' data-type='POLYGON' title='Draw polygon'>",
                    "<i class='fas fa-draw-polygon'></i>",
                "</span>",
                "<div class='textOptions'>",
                    "<span class='toolBtn' data-type='TEXT' title='Write text'>",
                        "<i class='fas fa-font'></i></a>",
                    "</span>",
                    "<div class='fontSizeInput hideElement'>",
                        "<button class='decreaseFontSize'>-</button>",
                        "<div class='fontSelection'>",
                            "<input type='number' class='fontInput' min='1' step='1' value='14'>",
                            "<div class='fontSizeValue hideElement'>",
                                "<div>1</div>",
                                "<div>2</div>",
                                "<div>4</div>",
                                "<div>8</div>",
                                "<div>11</div>",
                                "<div>14</div>",
                                "<div>18</div>",
                                "<div>24</div>",
                                "<div>30</div>",
                                "<div>36</div>",
                                "<div>48</div>",
                                "<div>60</div>",
                                "<div>72</div>",
                            "</div>",
                        "</div>",
                        "<button class='increaseFontSize'>+</button>",
                    "</div>",
                    // "<input class='fontInput hideFontInput' type='number' placeholder='Font Size' value='14'>",
                "</div>",
                // "<span class='toolBtn' data-type='TEXT' title='Write text'>",
                //     "<i class='fas fa-font'></i></a>",
                // "</span>",
                "<span class='toolBtn' data-type='ERASER' title='Erase drawing'>",
                    "<i class='fa fa-eraser'></i>",
                "</span>",
                "<span class='toolBtn' data-type='HELP' title='Learn how to annotate an image'>",
                    "<i class='fas fa-question-circle'></i></a>",
                "</span>"
                // "<span class='toolBtn' data-type='SAVE'>",
                //     "<i class='fa fa-floppy-o'></i>",
                // "</span>"
            ].join("");

            toolElem.querySelector(".toolBtn[data-type='"+this.curType+"']").className = "toolBtn selected";
            this.elem = toolElem;

            // Binding events
            this.elem.querySelectorAll(".toolBtn").forEach(function(elem){
                elem.addEventListener('click', this.onClickChangeBtn);
            }.bind(this));

            colorInput = this.elem.querySelector("#strokeColor");
            colorInput.addEventListener('change', this.onChangeStrokeColor);
        }
        else{
            colorInput = this.elem.querySelector("#strokeColor");
            // if a user changes the value, setAttribute doesn't work properly,
            // so we have to use .value here
            colorInput.value = this.curStroke;
            this.elem.querySelectorAll(".toolBtn").forEach(function(elem){
                elem.className = (elem.getAttribute("data-type") === _self.curType) ?  "toolBtn selected" : "toolBtn";
            });
        }

    }

    // Update the drawing info
    this.updateDrawInfo = function(data){
        for (var key in data){
            switch(key){
                case "svgID":
                    this.curSVGID = data.svgID;
                    break;
                case "groupID":
                    this.updateMode('CURSOR');
                    this.curGroupID = data.groupID;
                    break;
                case "stroke":
                    if (data.stroke && typeof data.stroke === "string") {
                        // the given color might not be understandable by input,
                        // so we have to change it into hex instead
                        var ctx = document.createElement("canvas").getContext("2d");
                        ctx.fillStyle = data.stroke;

                        // get the computed value
                        this.curStroke = ctx.fillStyle;
                    }
                    break;
                case "type":
                    this.curType = data.type ? data.type : "CURSOR";
                    this.updateMode(this.curType);
                    break;
            }
        }
    }

    // Update the current mode
    this.updateMode = function(mode, modeSubtype){

        if(!_self.elem){
            return;
        }
        
        _self.elem.querySelector(".toolBtn[data-type='"+_self.curType+"']").className = "toolBtn";
        
        _self.curType = mode || 'CURSOR';
        _self.curSubtype = modeSubtype || '';

        _self.elem.querySelector(".toolBtn[data-type='"+_self.curType+"']").className = "toolBtn selected";

        if(_self.curType != "TEXT"){
            _self.elem.querySelector(".fontSizeInput").classList.add("hideElement");
        }
        
        switch(_self.curType){
            case "CURSOR":
                _self.dispatchEvent("setMode", {
                    mode : "VIEW"
                });
                break;
            case "PATH":
            case "CIRCLE":
            case "RECT":
            case "LINE":
            case "POLYGON":
                _self.dispatchEvent("drawingStart", {
                    svgID : _self.curSVGID,
                    groupID : _self.curGroupID,
                    type : _self.curType,
                    attrs : {
                        "stroke" : _self.curStroke,
                        "fill" : "None"
                    }
                });
                break;
            case "ARROWLINE":
                _self.dispatchEvent("drawingStart", {
                    svgID : _self.curSVGID,
                    groupID : _self.curGroupID,
                    type : _self.curType,
                    subtype: modeSubtype,
                    attrs : {
                        "stroke" : _self.curStroke,
                        "fill" : "None",
                    }
                });
                break;
            case "TEXT":
                _self.dispatchEvent("drawingStart", {
                    svgID : _self.curSVGID,
                    groupID : _self.curGroupID,
                    type : _self.curType,
                    attrs : {
                        "stroke" : _self.curStroke,
                        "fill" : _self.curStroke,
                    }
                });
                break;
            case "ERASER":
                _self.dispatchEvent("setMode", {
                    mode : "ERASE_ANNOTATIONS"
                });
                break;
            case "SAVE":
                _self.dispatchEvent("saveAnatomySVG", {
                    svgID : _self.curSVGID,
                    groupID : _self.curGroupID,
                });
                break;
            default:
                break;
        }
    };

    // Get current drawing SVG Id and Group ID
    this.getDrawInfo = function(){
        return {
            svgID : this.curSVGID,
            groupID : this.curGroupID,
            stroke : this.curStroke
        }
    }

    // Method to handle specific functions for different annotation types
    this.handleAnnotationFunctions = function(type, subtype){

        if(type === "TEXT"){    

            var textSizeDiv = document.getElementsByClassName("fontSizeInput")[0];
            textSizeDiv.classList.remove("hideElement"); 
            var textOptionsDiv = document.getElementsByClassName("fontSizeValue")[0];
            textOptionsDiv.classList.add("hideElement");
            
            var textSizeInput = document.getElementsByClassName("fontInput")[0];
            
            if(textSizeInput != null){

                textSizeInput.addEventListener('focus', function (e) {
                    textOptionsDiv = document.getElementsByClassName("fontSizeValue")[0];
                    textOptionsDiv.classList.remove("hideElement");

                    var fontSizes = document.querySelectorAll(".fontSizeValue div");
                    for(var i = 0; i < fontSizes.length; i++){
                        fontSizes[i].addEventListener('click', function(e){
                            textSizeInput.value = this.innerHTML;
                            textOptionsDiv.classList.add("hideElement");
                            // Trigger an input event on the input element
                            var event = new Event('input', {
                                bubbles: true,
                                cancelable: true,
                            });
                            textSizeInput.dispatchEvent(event);
                        });
                    }
                });

                textSizeInput.addEventListener('input', function (e) {
                    if((this.value != null) && (this.value.trim() != "")){
                        fontSize = this.value.trim();
                        _self.dispatchEvent("changeTextSize", {
                            svgID: _self.curSVGID,
                            groupID: _self.curGroupID,
                            type: _self.curType,
                            fontSize: fontSize
                        });
                    }
                });

                var decreaseFontSize = document.getElementsByClassName("decreaseFontSize")[0];
                decreaseFontSize.addEventListener('click', function (e) {
                    if((textSizeInput.value != null) && (textSizeInput.value.trim() != "")){
                        fontSize = textSizeInput.value.trim();
                        fontSize = parseInt(fontSize) - 1;
                        if(fontSize > 0){
                            textSizeInput.value = fontSize;
                            _self.dispatchEvent("changeTextSize", {
                                svgID: _self.curSVGID,
                                groupID: _self.curGroupID,
                                type: _self.curType,
                                fontSize: fontSize
                            });
                        }
                    }
                });

                var increaseFontSize = document.getElementsByClassName("increaseFontSize")[0];
                increaseFontSize.addEventListener('click', function (e) {
                    if((textSizeInput.value != null) && (textSizeInput.value.trim() != "")){
                        fontSize = textSizeInput.value.trim();
                        fontSize = parseInt(fontSize) + 1;
                        if(fontSize > 0){
                            textSizeInput.value = fontSize;
                            _self.dispatchEvent("changeTextSize", {
                                svgID: _self.curSVGID,
                                groupID: _self.curGroupID,
                                type: _self.curType,
                                fontSize: fontSize
                            });
                        }
                    }
                });
            }
        }
        
    }
}
