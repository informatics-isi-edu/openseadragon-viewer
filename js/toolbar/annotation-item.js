function AnnotationItem(data){
    
    data = data || {};
    var _self = this;

    this.id = data.id || "";
    this.className = "annotationItem";
    this.description = data.description || "no description";
    this.anatomy = data.anatomy || "Unknown Anatomy";
    this.parent = data.parent || null;
    this.isDisplay = true;
    this.isFlagShown = true;
    this.isSelected = false;
    this.svgID = data.svgID;
    this.elem = null;

    // Click to change to current annotation group 
    this.onClickToSelect = function(){
        var id = (_self.isSelected) ? null : _self.id
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
            case "remove":
                _self.onClickToRemove();
                event.stopPropagation();
                break;
        }
    }

    // Click to change the annotation visibility
    this.onClickToChangeVisibility = function(){

        _self.isDisplay = !_self.isDisplay;
        _self.isFlagShown = _self.isDisplay;

        _self.parent.dispatchEvent('ChangeAnnotationVisibility', {
            id: _self.id,
            svgID : _self.svgID,
            isDisplay : _self.isDisplay
        });        
        _self.updateMenuIconClass();
    };

    // Change Description 
    this.onChangeDescription = function(event){
        _self.description = event.currentTarget.value;
        _self.parent.dispatchEvent('SetGroupAttributes', {
            groupID: _self.id,
            svgID : _self.svgID,
            description : _self.description
        });
        // event.stopPropagation();
    };

    // Change Anatomy
    this.onChangeAnatomy = function(event){
        _self.anatomy = event.currentTarget.value;
        _self.parent.dispatchEvent('SetGroupAttributes', {
            groupID: _self.id,
            svgID : _self.svgID,
            anatomy : _self.anatomy
        });
        // event.stopPropagation();
    }

    // Click to remove the annotation group
    this.onClickToRemove = function(){

        // Remove all the event listeners
        _self.elem.removeEventListener('click', _self.onClickToSelect);
        _self.elem.querySelectorAll(".editBtn").forEach(function(elem){
            elem.removeEventListener('click', this.onClickEditBtn);
        }.bind(this));
        _self.elem.querySelector(".description textarea.edit").removeEventListener('keyup', _self.onAutosizeTextarea);
        _self.elem.querySelector(".description textarea.edit").removeEventListener('change', _self.onChangeDescription);
        _self.elem.querySelector(".anatomy input.edit").removeEventListener('change', _self.onChangeAnatomy);

        // Remove the DOM element
        _self.elem.remove();
        _self.parent.remove(_self.id);
    };

    // Keyup to autosize textarea's height
    this.onAutosizeTextarea = function(event){
        var elem = _self.elem.querySelector(".description textarea");
        elem.style.height = "20px";
        elem.style.height = (elem.scrollHeight < 20) ? "20px" : elem.scrollHeight + "px";
    };
}

AnnotationItem.prototype.dispatchEvent = function(type, data){
    this.parent.dispatchEvent(type, data);
}

AnnotationItem.prototype.getIconClass = function(type){

    switch(type){
        case "toggleDisplay":
            return (this.isDisplay) ? 'fa fa-eye' : 'fa fa-eye-slash';
        case "moreInfo":
            return 'fa fa-external-link';
        case "remove":
            return 'fa fa-trash';
    }
}

AnnotationItem.prototype.render = function(){

    var annotationGroupElem = document.createElement("div");
    annotationGroupElem.setAttribute("class", "annotationItem");
    annotationGroupElem.setAttribute("annotation-id", this.id);

    annotationGroupElem.innerHTML = [
        "<div class='content'>",
            "<span class='anatomy'>",
                "<input class='edit' type='text' value='"+this.anatomy+"' data-type='anatomy'/>",
            "</span>",
            "<span class='description'>",
                "<textarea class='edit' data-type='description'>"+this.description+"</textarea>",
            "</span>",
        "</div>",
        "<span class='editRow'>",
            "<span class='editBtn' data-type='toggleDisplay'><i class='"+this.getIconClass('toggleDisplay')+"'></i></span>",
            // "<span class='editBtn' data-type='moreInfo'><i class='"+this.getIconClass('moreInfo')+"'></i></span>",
            // "<span class='editBtn' data-type='locateFlag'><i class='"+this.getIconClass('locateFlag')+"'></i></span>",
            // "<span class='editBtn' data-type='remove'><i class='"+this.getIconClass('remove')+"'></i></span>",
        "</span>"
    ].join("");

    this.elem = annotationGroupElem;

    // Binding events
    this.elem.addEventListener('click', this.onClickToSelect);
    this.elem.querySelector(".description textarea.edit").addEventListener('keyup', this.onAutosizeTextarea);
    this.elem.querySelector(".description textarea.edit").addEventListener('change', this.onChangeDescription);
    this.elem.querySelector(".anatomy input.edit").addEventListener('change', this.onChangeAnatomy);
    this.elem.querySelectorAll(".editBtn").forEach(function(elem){
        elem.addEventListener('click', this.onClickEditBtn);
    }.bind(this));
    
    this.onAutosizeTextarea();
}

// Change current selected annotation group style
AnnotationItem.prototype.changeSelectedStyle = function(){
    if(this.elem == null){ return;};
    this.elem.className = (this.isSelected) ? this.className + " current" : this.className;
}

// Change menu icon style
AnnotationItem.prototype.updateMenuIconClass = function(){
    if(this.elem == null){ return;};
    this.elem.querySelector(".editBtn[data-type='toggleDisplay']").innerHTML = "<i class='"+this.getIconClass('toggleDisplay')+"'></i>";
}



