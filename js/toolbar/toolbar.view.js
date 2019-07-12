function ToolbarView(controller, config){

    if(!controller || !config){ return null; };

    var _self = this;

    this._containerElem = document.getElementById(config.elems.containerId);
    this._navMenuElem = document.getElementById(config.elems.navMenuId);
    this._navMenuContentElem = document.getElementById(config.elems.navMenuContentId);
    this._types = config.navMenu;
    this._toolbarController = controller;
    
    this.onClickMenuBtn = function(event){
        // Get menu button type clicked by the user
        var clickMenuType = this.getAttribute("data-type") || "";

        // clear all button's selected class
        _self.unselectMenuType();

        // additional logic in the controller
        _self._toolbarController.onClickedMenuHandler(clickMenuType);
    }

    // this.renderToolbarMenu();
}

// Render the toolbar menu 
ToolbarView.prototype.renderToolbarMenu = function(){
    for (key in this._types) {
        type = this._types[key];
        elem = '<div class="menuType" data-type="' + key + '" title="' + type.tooltip + '">' + type.iconElem + '</div>'
        this._navMenuElem.innerHTML += elem;
    }

    this._navMenuElem.querySelectorAll(".menuType").forEach(function(elem){
        elem.addEventListener('click', this.onClickMenuBtn);
    }.bind(this))
}

// Render the annotation group menu
ToolbarView.prototype.renderAnnotationGroupContent = function(annotationList){

    // Add 'expand' class to the menu content
    // this._navMenuContentElem.className = (this._navMenuContentElem.classList.length == 0) ? "expand" : "";
    // Clear menu content
    this._navMenuContentElem.innerHTML = "";
    // Render annotation list if it's null 
    if(annotationList.elem == null){
        annotationList.render();
    }
    // Append annotation list 
    this._navMenuContentElem.appendChild(annotationList.elem);
}

// Render the annotation group menu
ToolbarView.prototype.renderChannelContent = function(channelList){

    // Add 'expand' class to the menu content
    // this._navMenuContentElem.className = (this._navMenuContentElem.classList.length == 0) ? "expand" : "";
    // Clear menu content
    this._navMenuContentElem.innerHTML = "";
    // Render channel list if it's null 
    if(channelList.elem == null){
        channelList.render();
    }
    // Append annotation list 
    this._navMenuContentElem.appendChild(channelList.elem);
}

// Remove all the content from selected menu content
ToolbarView.prototype.removeSelectedMenuContent = function(){
    this._navMenuContentElem.children().remove();
}

// Remove all the selected menu style from toolbar 
ToolbarView.prototype.unselectMenuType = function(){
    this._navMenuElem.querySelectorAll(".menuType").forEach(function(elem){
        elem.className = "menuType";
    })
    // this._navMenuContentElem.className = "";
}

// Set the selected menu style
ToolbarView.prototype.selectMenuType = function(type){
    this.unselectMenuType();
    if(type){
        this._navMenuElem.querySelector(".menuType[data-type='"+type+"']").className += " selected";
    }
}