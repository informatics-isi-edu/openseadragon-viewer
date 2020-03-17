function AnnotationTool(parent){
    
    var _self = this;

    this.elem = null;
    this.parent = parent || null;
    this.isDisplay = false;
    this.curType = 'CURSOR';
    this.curSVGID = '';
    this.curGroupID = '';
    this.curColor = '#f00000';

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

        _self.elem.querySelector(".toolBtn[data-type='"+_self.curType+"']").className = "toolBtn";
        _self.elem.querySelector(".toolBtn[data-type='"+btnType+"']").className = "toolBtn selected";
        _self.curType = btnType;

        switch(btnType){
            case "CURSOR":
                _self.dispatchEvent("setMode", {
                    mode : "VIEW"
                });
                _self.dispatchEvent("drawingStop");
                break;
            case "PATH":
            case "CIRCLE":
            case "RECT":
                _self.dispatchEvent("drawingStop");
                _self.dispatchEvent("drawingStart", {
                    svgID : _self.curSVGID,
                    groupID : _self.curGroupID,
                    type : btnType,
                    attrs : {
                        "stroke" : _self.curColor,
                        "fill" : "None"
                    }
                });
                break;
            case "ERASER":
                _self.dispatchEvent("drawingStop");
                _self.dispatchEvent("setMode", {
                    mode : "ERASE_ANNOTATIONS"
                });
                break;
            default:
                _self.dispatchEvent("drawingStop");
                break;
        }
    }

    // Change stroke color
    this.onChangeStrokeColor = function(){
        _self.curColor = this.value;
    }

    // Render the view
    this.render = function(data){
         
        var toolElem = document.createElement("div");
        toolElem.setAttribute("class", "annotationTool flex-col");
        toolElem.innerHTML = [
            "<span class='toolBtn' data-type='CURSOR' data-toggle='tooltip' data-placement='right' title='Tooltip on right'>",
                "<i class='fa fa-mouse-pointer'></i>",
            "</span>",
            "<span class='toolBtn' data-type='CHANGE_COLOR'>",
                "<input type='color' value='" + _self.curColor + "' id='strokeColor'/>",
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
            
        ].join("");

        toolElem.querySelector(".toolBtn[data-type='"+this.curType+"']").className = "toolBtn selected";
        this.elem = toolElem;

        // Binding events
        this.elem.querySelectorAll(".toolBtn").forEach(function(elem){
            elem.addEventListener('click', this.onClickChangeBtn);
        }.bind(this));

        var colorInput = this.elem.querySelector("#strokeColor");
        colorInput.addEventListener('change', this.onChangeStrokeColor);
    }

    // Update the drawing info
    this.updateDrawInfo = function(data){
        this.curSVGID = data.svgID;
        this.curGroupID = data.groupID;
    }
    
    // Get current drawing SVG Id and Group ID
    this.getDrawInfo = function(){
        return {
            svgID : this.curSVGID,
            groupID : this.curGroupID
        }
    }
}