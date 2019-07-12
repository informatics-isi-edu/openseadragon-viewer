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
        this.annotationList.changeSelectingAnnotation(data.id);
    }

    // Dispatch event to Viewer
    this.dispatchEvent = function(type, data){
        switch(type){
            // Change the visibility of annotation in Openseasdragon viewer
            case "ChangeAnnotationVisibility":
                this._viewer.changeAnnotationVisibility(data);
                break;
            // Change selecting annotation in Openseadragon viewer
            case "ChangeSelectingAnnotation":
                this._viewer.changeSelectingAnnotation(data);
                break;
            // Change annotation 'description' or 'anatomy' text
            case "ChangeAnnotationDescription":
            case "ChangeAnnotationAnatomy":
                this._viewer.setAnnotationAttributes(data);
                break;
            // Change all the annotation groups visibility
            case "ChangeOverlayVisibility":
                this._viewer.changeOverlayVisibility(data.isDisplay);                
                break;
            // Change openseadragon item overlay visibility
            case "ChangeOsdItemVisibility":
                this._viewer.setItemVisibility(data.osdItemId, data.isDisplay); 
                break;
            // Change openseadragon item channel setting
            case "ChangeOsdItemChannelSetting":
                this._viewer.setItemChannel(data);
                break;
            // Create a new annotation
            case "CreateNewAnnotationGroup":
                this._viewer.createAnnotationGroup();
                break;
            case "DrawAnnotationObject":
                this._viewer.createAnnotationObject(data.type);
                break;
            // Locate a flag on openseadragon
            // case "LocateAnnotationFlag":
            //     this._viewer.locateAnnotationFlag(data);
            //     break;
            case "ExportSVG":
                this._viewer.exportAnnotationsToSVG();
                break;
            // Remove the annotation in Openseasdragon viewer
            case "RemoveAnnotation":
                this._viewer.removeAnnotationById(data.id);
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
            this._viewer.destoryMouseTracker();
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
            case "drawLine":
                this.dispatchEvent("DrawAnnotationObject", { type : "SCRIBBLE"});
                break;
            case "drawRectangle":
                this.dispatchEvent("DrawAnnotationObject", { type : "RECT"});
                break;
            case "drawCircle":
                this.dispatchEvent("DrawAnnotationObject", { type : "CIRCLE"});
                break;
            case "exportSVG":
                this.dispatchEvent("ExportSVG");
                break;
        }
    }

    // Update the current selected menu and style
    this.selectMenuType = function(type){
        this.selectingMenu = type || ""; 
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

