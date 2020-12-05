function AnnotationTool(parent){

    var _self = this;

    this.elem = null;
    this.parent = parent || null;
    this.isDisplay = false;
    this.curType = 'CURSOR';
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
        _self.updateMode(btnType);

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
                "<span class='toolBtn' data-type='POLYGON' title='Draw polygon'>",
                    "<i class='fas fa-draw-polygon'></i>",
                "</span>",
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
    this.updateMode = function(mode){

        if(!_self.elem){
            return;
        }

        _self.elem.querySelector(".toolBtn[data-type='"+_self.curType+"']").className = "toolBtn";
        _self.curType = mode || 'CURSOR';
        _self.elem.querySelector(".toolBtn[data-type='"+_self.curType+"']").className = "toolBtn selected";
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
}
