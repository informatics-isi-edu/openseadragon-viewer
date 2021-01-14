function ToolbarController(parent, config){

    if(!config){ return null; };

    var _self = this;
    this.parent = parent;
    this._toolbarView = new ToolbarView(this, config);
    this.annotationList = new AnnotationList(this);
    this.annotationTool = new AnnotationTool(this);
    this.channelList = new ChannelList(this);
    this.zPlaneList = new ZPlaneList(this);

    // Set current selecting annotation
    this.changeSelectingAnnotation = function(data){
        this.annotationList.changeSelectingAnnotation(data);
    }

    // Close annotation tool
    this.closeAnnotationTool = function(){
        this.annotationTool.updateMode('CURSOR');
        this.annotationTool.updateDrawInfo({
            svgID : '',
            groupID : '',
            type : null
        });
        this._toolbarView.removeAnnotationTool(this.annotationTool);
    }

    // Dispatch event to Viewer
    this.dispatchEvent = function(type, data){
        switch(type){
            default:
                this.parent.dispatchEvent(type, data);
                break;

        }
    }

    // Turn on/off annotation drawing mode
    this.toggleDrawingTool = function(data){

        // Drawing mode
        var mode = data.mode.toUpperCase();
        // Check if the svg id exists
        var svgID = data.svgID || "";
        var groupID = data.groupID || "";

        if(svgID != "" && groupID != ""){
            if(mode == "ON"){
                // Save drawing SVG ID and group ID
                this.annotationTool.updateDrawInfo(data);
                this._toolbarView.renderAnnotationTool(this.annotationTool);
            }
            else{
                this.annotationTool.updateDrawInfo({
                    type : "",
                    svgID : "",
                    groupID : ""
                });
                this._toolbarView.removeAnnotationTool(this.annotationTool);
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
        this.channelList.updateList(data);
    }

    // replace channel list from viewer
    this.replaceChannelList = function(data){
        this.channelList.replaceList(data);
        this._toolbarView.renderChannelContent(this.channelList);
    }

    // update the image gallery from outside (chaise)
    this.updateZPlaneList = function(data){
        this.zPlaneList.updateList(data);
    }

    this.initializeZPlaneList = function (data) {
        this.zPlaneList.init(data);
    }

    // update current drawing svg Id if drawing mode is on
    this.updateDrawingSVGId = function(data){
        if(this.annotationTool.curSVGID === data.svgID){
            this.annotationTool.updateDrawInfo({
                svgID : data.newSvgID
            });
        }
    }

    // update current drawing group Id if drawing mode is on
    this.updateDrawingGroupId = function(data){
        if(this.annotationTool.curSVGID === data.svgID){
            this.annotationTool.updateDrawInfo({
                groupID : data.newGroupID
            });
        }
    }
}
