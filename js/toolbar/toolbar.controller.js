function ToolbarController(viewer, config){
    
    if(!viewer || !config){ return null; };

    var _self = this;

    this._toolbarView = new ToolbarView(this, config);
    this._viewer = viewer;
    this.annotationList = new AnnotationList(this);
    this.channelList = new ChannelList(this);
    this.selectingMenu = null;

    // Set current selecting annotation
    this.changeSelectingAnnotation = function(data){
        this.annotationList.changeSelectingAnnotation(data);
    }

    // Dispatch event to Viewer
    this.dispatchEvent = function(type, data){
        switch(type){
            
            case "ChangeAnnotationVisibility": // Change annotation group visibility
            case "ChangeSelectingAnnotationGroup": // Change selecting annotation group
            case "ChangeAllVisibility": // Change all annotations visibility
            case "RemoveAnnotationGroup": // Remove an annotation group
            case "SetGroupAttributes": // Change annotation 'description' or 'anatomy' text
                this._viewer.dispatchSVGEvent(type, data);
                break;
            // Change openseadragon item overlay visibility
            case "ChangeOsdItemVisibility":
                this._viewer.setItemVisibility(data.osdItemId, data.isDisplay); 
                break;
            // Change openseadragon item channel setting
            case "ChangeOsdItemChannelSetting":
                this._viewer.setItemChannel(data);
                break;
            case "ZoomIn":
                this._viewer.zoomIn();
                break;
            case "ZoomOut":
                this._viewer.zoomOut();
                break;
            
        }
    }

    // Get overlay visibility in Openseadragon viewer
    this.getOsdOverlayVisibility = function(){
        return this._viewer.getOverlayVisibility();
    }

    // Hide annotation list
    this.hideAnnotationList = function(){
        this.annotationList.hideAll();
    }

    // Show annotation list
    this.showAnnotationList = function(){
        this.annotationList.showAll();
    }

    // Binding events when toolbar menu get clicked by the user
    this.onClickedMenuHandler = function(clickMenuType){

        // User cancel to create a new annotation and remove the annotation object created 
        if(this.selectingMenu == clickMenuType && clickMenuType != ""){
            this.selectingMenu = "";
            return;
        }

        this.selectingMenu = clickMenuType;

        // Trigger event handler for different menu type 
        switch (clickMenuType) {
            case "channelList":
                this._toolbarView.renderChannelContent(this.channelList);
                break;
            case "annotationList":
                this._toolbarView.renderAnnotationGroupContent(this.annotationList);
                break;
            case "zoomIn":
                this.dispatchEvent("ZoomIn");
                break;
            case "zoomOut":
                this.dispatchEvent("ZoomOut");
                break;
            case "exportSVG":
                this.dispatchEvent("ExportSVG");
                break;
        }
    }

    // Update the annotation from viewer
    this.updateAnnotationList = function(data){
        this.annotationList.updateList(data);
    }

    // update channel from viewer
    this.updateChannelList = function(data){
        this.channelList.add(data);
    }
}

