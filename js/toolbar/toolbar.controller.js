function ToolbarController(parent, config){

    if(!config){ return null; };

    var _self = this;
    this.parent = parent;
    this._toolbarView = new ToolbarView(this, config);
    this.annotationTool = new AnnotationTool(this);
    this.channelList = new ChannelList(this);
    this.zPlaneList = new ZPlaneList(this);

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

    // Binding events when toolbar menu get clicked by the user
    this.onClickedMenuHandler = function(clickMenuType, forcedStateIsExpanded){

        // Trigger event handler for different menu type
        switch (clickMenuType) {
            case "channelList":
                this._toolbarView.toggleDisplayMenuContent(clickMenuType, this.channelList, forcedStateIsExpanded);
                break;
            case "zoomIn":
                this.dispatchEvent("zoomIn");
                break;
            case "zoomOut":
                this.dispatchEvent("zoomOut");
                break;
        }
    }

    // update channel from viewer
    this.updateChannelList = function(data){
        this.channelList.updateList(data);
    }

    // replace channel list from viewer
    this.replaceChannelList = function(data){
        this.channelList.replaceList(data);
        this._toolbarView.renderChannelContent(this.channelList, true);
        // show the channel list by default if there are more than 1
        if (Array.isArray(data.channelList) && data.channelList.length > 1) {
            // make sure the menu is open
            this.onClickedMenuHandler('channelList', true);
            // make sure chaise is showing proper button state
            this.dispatchEvent("showChannelList");
        }
    }

    this.updateChannelConfigDone = function (data) {
        this.channelList.saveAllChannelsDone(data);
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

    this.updatedDefaultZIndex = function(data) {
        this.zPlaneList.updatedDefaultZIndex(data);
    }
}
