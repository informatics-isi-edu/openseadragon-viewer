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


    // Render the toolbar menu 
    this.renderToolbarMenu = function(){
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
    this.renderAnnotationGroupContent = function(annotationList){

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
    this.renderChannelContent = function(channelList){

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
    this.removeSelectedMenuContent = function(){
        this._navMenuContentElem.children().remove();
    }

    // Set the selected menu style
    this.selectMenuType = function(type){
        this.unselectMenuType();
        if(type){
            this._navMenuElem.querySelector(".menuType[data-type='"+type+"']").className += " selected";
        }
    }

    // Toggle menu content 
    this.toggleDisplayMenuContent = function(type, list){
        
        this._navMenuContentElem.className = (this._navMenuContentElem.className.indexOf("expand") >= 0) ? "" : "expand";

        // if it's expand, insert the content
        if(this._navMenuContentElem.className.indexOf("expand") >= 0){
            switch(type){
                case "channelList":
                    this.renderChannelContent(list);
                    break;
                case "annotationList":
                    this.renderAnnotationGroupContent(list);
                    break;
            }
        }

    }

    // Remove all the selected menu style from toolbar 
    this.unselectMenuType = function(){
        this._navMenuElem.querySelectorAll(".menuType").forEach(function(elem){
            elem.className = "menuType";
        })
    }
}


