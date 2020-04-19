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

        if(_self.curType == btnType){
            return;
        }

        
        _self.dispatchEvent("drawingStop");
        _self.updateMode(btnType);
        
    }

    // Change stroke color
    this.onChangeStrokeColor = function(){
        _self.curStroke = this.value;
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
                "<span class='toolBtn' data-type='CHANGE_COLOR'>",
                    "<input type='color' value='" + _self.curStroke + "' id='strokeColor'/>",
                "</span>",
                "<span class='toolBtn' data-type='PATH'>",
                    "<i class='fa fa-pencil'></i>",
                "</span>",
                "<span class='toolBtn' data-type='RECT'>",
                    "<i class='fa fa-square'></i>",
                "</span>",
                "<span class='toolBtn' data-type='CIRCLE'>",
                    "<i class='fa fa-circle'></i>",
                "</span>",
                "<span class='toolBtn' data-type='ERASER'>",
                    "<i class='fa fa-eraser'></i>",
                "</span>",
                // "<span class='toolBtn' data-type='SAVE'>",
                //     "<i class='fa fa-floppy-o'></i>",
                // "</span>",
                
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
            colorInput.setAttribute("value", this.curStroke);
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
                    this.curStroke = data.stroke;
                    break;
                case "type":
                    this.curType = data.type ? data.type : "CURSOR";
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