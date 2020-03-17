function ToolbarController(parent, config){
    
    if(!config){ return null; };

    var _self = this;
    this.parent = parent;
    this._toolbarView = new ToolbarView(this, config);
    this.annotationList = new AnnotationList(this);
    this.annotationTool = new AnnotationTool(this);
    this.channelList = new ChannelList(this);

    // Set current selecting annotation
    this.changeSelectingAnnotation = function(data){
        this.annotationList.changeSelectingAnnotation(data);
    }

    // Dispatch event to Viewer
    this.dispatchEvent = function(type, data){
        switch(type){
            default:
                this.parent.dispatchEvent(type, data);
                break;
            
        }
    }

    // Turn on annotation drawing mode
    this.drawAnnotationMode = function(data){

        // Drawing mode
        var mode = data.mode.toUpperCase();
        // Check if the svg id exists 
        var svgID = data.svgID || "";
        var groupID = data.groupID || "";
        
        if(svgID != "" && groupID != ""){
            if(mode == "ON"){
                this._toolbarView.renderAnnotationTool(this.annotationTool, data);
            }
            else{
                this._toolbarView.removeAnnotationTool();
            }
            
        }

    }

    // Get current drawing SVG Id and Group ID
    this.getDrawInfo = function(){
        return this.annotationTool.getDrawInfo();
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
    this.onClickedMenuHandler = function(clickMenuType, data){

        // Trigger event handler for different menu type 
        switch (clickMenuType) {
            case "channelList":
                this._toolbarView.toggleDisplayMenuContent(clickMenuType, this.channelList);
                break;
            case "annotationList":
                this._toolbarView.toggleDisplayMenuContent(clickMenuType, this.annotationList);
                break;
            case "zoomIn":
                this.dispatchEvent("zoomIn");
                break;
            case "zoomOut":
                this.dispatchEvent("zoomOut");
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

