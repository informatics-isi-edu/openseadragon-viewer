function AnnotationItem(data){
    
    data = data || {};
    var _self = this;

    this.id = data.id || "";
    this.className = "annotationItem";
    this.description = data.description || "no description";
    this.anatomy = data.anatomy || "Unknown Anatomy";
    this.parent = data.parent || null;
    this.isDisplay = true;
    this.isSelected = false;
    this.isHighlight = false;
    this.svgID = data.svgID;
    this.elem = null;

    // Change current selected annotation group style
    this.changeSelectedStyle = function(){
        if(this.elem == null){ return;};
        this.elem.className = (this.isSelected) ? this.className + " current" : this.className;
        this.updateMenuIconClass();
        this.updateTooltip();
    }

    // Dispatch events to parents
    this.dispatchEvent = function(type, data){
        this.parent.dispatchEvent(type, data);
    }

    this.getIconClass = function(type){

        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'fa fa-eye' : 'fa fa-eye-slash';
            case "highlightGroup":
                return (this.isSelected) ? "fa fa-tag highlight" : "fa fa-tag";
        }
    }

    this.getTooltip = function(type){

        switch(type){
            case "toggleDisplay":
                return (this.isDisplay) ? 'Hide annotation' : 'Show annotation';
            case "highlightGroup":
                return (this.isSelected) ? 'Unhighlight' : 'Highlight';
        }
    }

    this.render = function(){

        var annotationGroupElem = document.createElement("div");
        annotationGroupElem.setAttribute("class", "annotationItem");
        annotationGroupElem.setAttribute("annotation-id", this.id);

        annotationGroupElem.innerHTML = [
            "<span class='editRow'>",
                "<span class='editBtn' data-type='toggleDisplay' data-toggle='tooltip' data-placement='bottom' title='"+this.getTooltip('toggleDisplay')+"'>",
                    "<i class='"+this.getIconClass('toggleDisplay')+"'></i>",
                "</span>",
                "<span class='editBtn' data-type='highlightGroup' data-toggle='tooltip' data-placement='bottom' title='"+this.getTooltip('highlightGroup')+"'>",
                    "<i class='"+this.getIconClass('highlightGroup')+"'></i>",
                "</span>",
            "</span>",
            "<div class='content'>",
                "<span class='anatomy'>",
                    this.anatomy,
                "</span>",
                "<span class='description'>",
                    "<textarea class='edit' data-type='description'>"+this.description+"</textarea>",
                "</span>",
            "</div>"
        ].join("");
    
        this.elem = annotationGroupElem;

        // Bootstrap create tooltips
        $(annotationGroupElem).find("[data-toggle='tooltip']").tooltip({
            container : "body",
            boundary : 'window',
            offset : 10
        });

        // Binding events
        this.elem.addEventListener('click', this.onClickToSelect);
        this.elem.querySelector(".description textarea.edit").addEventListener('keyup', this.onAutosizeTextarea);
        this.elem.querySelector(".description textarea.edit").addEventListener('change', this.onChangeDescription);
        this.elem.querySelectorAll(".editBtn").forEach(function(elem){
            elem.addEventListener('click', this.onClickEditBtn);
        }.bind(this));
        
        this.onAutosizeTextarea();
    }

    // Click to change to current annotation group 
    this.onClickToSelect = function(){
        _self.dispatchEvent("ChangeSelectingAnnotationGroup", {
            groupID : _self.id,
            svgID : _self.svgID
        });
    }

    // Click edit button
    this.onClickEditBtn = function(event){

        var type = this.getAttribute("data-type");
        switch(type){
            case "toggleDisplay":
                _self.onClickToChangeVisibility();
                event.stopPropagation();
                break;
            case "highlightGroup":
                _self.onClickHighlight();
                break;
            case "remove":
                _self.onClickToRemove();
                event.stopPropagation();
                break;
        }
    }

    // Click to change the annotation visibility
    this.onClickToChangeVisibility = function(){

        _self.isDisplay = !_self.isDisplay;
        
        _self.dispatchEvent('ChangeAnnotationVisibility', {
            id: _self.id,
            svgID : _self.svgID,
            isDisplay : _self.isDisplay
        });        
        _self.updateMenuIconClass();
        _self.updateTooltip();
    };

    // Change Description 
    this.onChangeDescription = function(event){
        _self.description = event.currentTarget.value;
        _self.dispatchEvent('SetGroupAttributes', {
            groupID: _self.id,
            svgID : _self.svgID,
            description : _self.description
        });
    };

    // Click to remove the annotation group
    this.onClickToRemove = function(){

        // Remove all the event listeners
        _self.elem.removeEventListener('click', _self.onClickToSelect);
        _self.elem.querySelectorAll(".editBtn").forEach(function(elem){
            elem.removeEventListener('click', this.onClickEditBtn);
        }.bind(this));
        _self.elem.querySelector(".description textarea.edit").removeEventListener('keyup', _self.onAutosizeTextarea);
        _self.elem.querySelector(".description textarea.edit").removeEventListener('change', _self.onChangeDescription);

        // Remove the DOM element
        _self.elem.remove();
        _self.parent.remove(_self.id);
    };

    // Click to highlight
    this.onClickHighlight = function(){
        // if isDisplay is false, set it to true in order to show and highlight the annotation
        // if(!_self.isDisplay){
        //     _self.onClickToChangeVisibility();
        // }
    }
    
    // Keyup to autosize textarea's height
    this.onAutosizeTextarea = function(event){
        var elem = _self.elem.querySelector(".description textarea");
        elem.style.height = "20px";
        elem.style.height = (elem.scrollHeight < 20) ? "20px" : elem.scrollHeight + "px";
    };

    // Change menu icon style
    this.updateMenuIconClass = function(){
        if(this.elem == null){ return;};
        this.elem.querySelector(".editBtn[data-type='toggleDisplay']").innerHTML = "<i class='"+this.getIconClass('toggleDisplay')+"'></i>";
        this.elem.querySelector(".editBtn[data-type='highlightGroup']").innerHTML = "<i class='"+this.getIconClass('highlightGroup')+"'></i>";
    }

    // Update menu Bootstrap tooltip content
    this.updateTooltip = function(){
        if(this.elem == null){ return;};
        this.elem.querySelector(".editBtn[data-type='toggleDisplay']").setAttribute("data-original-title", this.getTooltip('toggleDisplay'));
        this.elem.querySelector(".editBtn[data-type='highlightGroup']").setAttribute("data-original-title", this.getTooltip('highlightGroup'));
        
        $(this.elem).find("[data-toggle='tooltip']").tooltip('hide');
    }
}













