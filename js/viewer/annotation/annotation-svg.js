function AnnotationSVG(parent, id, imgWidth, imgHeight, scale, ignoreReferencePoint, ignoreDimension){
    this.id = id;
    this.svg = null;
    this.parent = parent;
    this.scale = scale;
    this.imgScaleX = 1;
    this.imgScaleY = 1;
    this.imgWidth = imgWidth;
    this.imgHeight = imgHeight;
    // reference point to the actual images
    this.ignoreReferencePoint = ignoreReferencePoint;
    this.ignoreDimension = ignoreDimension;
    this.upperLeftPoint = null;
    this.bottomRightPoint = null;
    this.groups = {};
    this.isSelected = false;
    this.currentGroupID = "";

    this.annotationUtils = new AnnotationUtils();


    // Create drawing area for grouping annotations with same id
    this.createAnnotationGroup = function (id, anatomy, description) {
        // Check if the area has created
        id = id ? id : Date.parse(new Date());
        var isGroupEmpty = this.groups.hasOwnProperty(id) ? false : true;
        var group = null;

        // Check if annotation id has already existed and create one if not
        if (isGroupEmpty) {
            group = new AnnotationGroup(id, anatomy, description, this);
            group.render();
            this.groups[id] = group;
            return group;
        }
    }

    /**
     * This function creates an annotation SVG object containing an annotation group.
     * The annotation group contains the annotation to be drawn.
     * @param {string} groupID - Unique id for the annotation group.
     * @param {string} type - Type of the annotation to be drawn.
     * @param {string} subtype - Subtype of the annotation, for example the type of arrowhead for arrowline annotation.
     * @param {object} attrs - Attributes to be added to the annotation.
     */
    this.createAnnotationObject = function(groupID, type, subtype, attrs){

        var group,
            annotation;

        if(this.groups.hasOwnProperty(groupID)){
            
            // Find corresponding group
            group = this.groups[groupID];

            annotation = group.addAnnotation(type, subtype, attrs);
            annotation.renderSVG(group);
            annotation.setupDrawingAttrs(attrs);
            this.dispatchEvent("onDrawingBegin", {
                svgID : this.id,
                groupID : groupID,
                graphID : annotation.id,
                viewBox : this.getViewBox(),
                imgScaleX : this.imgScaleX,
                imgScaleY : this.imgScaleY,
                annotation : annotation,
                type : type,
                subtype: subtype,
                attrs : attrs
            })
            // this.dispatchEvent("removeHandlers", null);

        }
    }

    /**
    * This function changes the color of the annotation that is worked on, to the new color passes in the data
    * @param {object} data Contain information about the object that is being drawn/editted
    */
    this.changeDrawingStroke = function (data) {

        for (var groupID in this.groups) {
            // change the color for only the group that is being worked on
            if (groupID == data.groupID) {
                this.groups[groupID].updateStroke(data.groupID, data.attrs.stroke);
            }
        }
    }

    // Change the group visibility
    this.changeVisibility = function(data){

        if(this.groups.hasOwnProperty(data.groupID)){
            this.hideGroupBorder();
            var group = this.groups[data.groupID];
            group.setDisplay(data.isDisplay);
        }
    }

    // Change all groups visibility
    this.changeAllVisibility = function(isDisplay){
        var groupID;
        for (groupID in this.groups) {
            group = this.groups[groupID];
            group.setDisplay(isDisplay);
        }

        if(!isDisplay){
            this.hideGroupBorder();
        }
    }

    // Change SVG ID
    this.changeSVGId = function(data){

        if(this.id === data.svgID){
            this.id = data.newSvgID;
            this.dispatchEvent("updateSVGId", data);
        }
    }

    this.changeGroupInfo = function(data){

        if(this.groups.hasOwnProperty(data.groupID)){
            var prevGroup = this.groups[data.groupID];
            prevGroup.updateInfo({
                id : data.newGroupID,
                anatomy : data.newAnatomy
            })

            this.groups[data.newGroupID] = prevGroup;

            if(this.currentGroupID === data.groupID){
                this.currentGroupID = data.newGroupID;
            };

            delete this.groups[data.groupID];

            this.dispatchEvent("updateGroupInfo", data);
        }
    }

    this.changeSelectedGroup = function(data){

        if(this.currentGroupID == data.groupID){
            if(this.groups.hasOwnProperty(this.currentGroupID)){
                var group = this.groups[this.currentGroupID];
                group.isSelected = false;
                group.unHighlightAll();
                this.hideGroupBorder();
            }
            this.currentGroupID = "";
        }
        else{
            if(this.groups.hasOwnProperty(this.currentGroupID)){
                var group = this.groups[this.currentGroupID];
                group.isSelected = false;
                group.unHighlightAll();
                this.hideGroupBorder();
            }

            if(this.groups.hasOwnProperty(data.groupID) && data.groupID != this.currentGroupID){
                var group = this.groups[data.groupID];
                group.highlightAll();
                group.isSelected = true;
                this.currentGroupID = data.groupID;

                // Bring up the element to the front
                this.svg.append(group.svg.node());

                // data["x1"] = this.upperLeftPoint.x + group["x1"] * this.xUnit;
                // data["x2"] = this.upperLeftPoint.x + group["x2"] * this.xUnit;
                // data["y1"] = this.upperLeftPoint.y + group["y1"] * this.yUnit;
                // data["y2"] = this.upperLeftPoint.y + group["y2"] * this.yUnit;

                    // Show border if the group's visibility set to true
                if(group.isDisplay){
                    this.showGroupBorder({
                        x1 : group["x1"],
                        y1 : group["y1"],
                        x2 : group["x2"],
                        y2 : group["y2"]
                    });
                }

            }
        }


        data["svgID"] = this.id;
        // data["groupID"] = this.currentGroupID;

    }

    this.changeStrokeScale = function(data){

        for(var groupID in this.groups){
            this.groups[groupID].updateStrokeWidth();

            if(this.currentGroupID == groupID){
                this.groups[groupID].highlightAll();
            }
        }
    }

    this.dispatchEvent = function(type, data){
        switch(type){
            // Change the selecting annotation
            case "onClickChangeSelectingAnnotation":
                data.svgID = this.id;
                this.parent.dispatchEvent(type, data);
                break;
            case "onMouseoverShowTooltip":
                this.unHighlightCurrentGroup(data.groupID);
                this.showGroupBorder(data);
                this.parent.dispatchEvent(type, data);
                break;
            case "onMouseoutHideTooltip":
                this.highlightCurrentGroup();
                this.hideGroupBorder();
                this.parent.dispatchEvent(type, data);
                break;
            default:
                this.parent.dispatchEvent(type, data);
                break;
        }

    }

    /**
     * export a list of svg files
     * each svg file only contains one anatomy ID
     * @param groupID : the group id
     * @return Array of objects that contains svg content of each group
     */
    this.exportToSVG = function(groupID){
        var rst = [];
        var svg = "";
        var imgScaleX = (this.imgScaleX) ? this.imgScaleX : 1;
        var imgScaleY = (this.imgScaleY) ? this.imgScaleY : 1;

        // return matched group SVG content only if groupID provided
        if(groupID){
            if(this.groups.hasOwnProperty(groupID)){
                var innerSVG = this.groups[groupID].exportToSVG();
                if (innerSVG != "") {
                    // if there is some content present in the innerSVG, only then add to rst, else return empty array.
                    svg += "<svg viewBox='" + this.getViewBox().join(" ") + "' xmlns='http://www.w3.org/2000/svg'  xmlns:xlink='http://www.w3.org/1999/xlink'>";
                    svg += "<scale x='" + imgScaleX + "' y='" + imgScaleY + "'/>";
                    svg += innerSVG;
                    svg += "</svg>";
                    rst.push({
                        svgID: this.id,
                        groupID: groupID,
                        numOfAnnotations: this.groups[groupID].getNumOfAnnotations(),
                        svg: svg,
                        stroke: this.groups[groupID].stroke
                    });
                }
            }
        }

        return rst;
    }

    this.getStrokeScale = function(){
        return this.parent.getStrokeScale();
    }

    // get viewbox of the svg
    this.getViewBox = function(){
        return (this.viewBox) ? this.viewBox : [0, 0, this.imgWidth, this.imgHeight];
    }

    // highlight current group when user leave the hovering group
    this.highlightCurrentGroup = function(){
        if(this.currentGroupID != ""){
            var group = this.groups[this.currentGroupID];
            group.highlightAll();
        }
    }

    // Hide border of annotation group
    this.hideGroupBorder = function () {
        d3.select(this.svg)
            .selectAll("rect.groupBorder")
            .remove();
    }

    this.parseSVGFile = function(svgFile){
        var self = this;

        if(!svgFile){ return; }

        // to set the viewBox attribute of the svg, first it is checked of the attributes exsists in the svg file itself or not. If it does exsist then that value is assigned, otherwise we look for the min-x, min-y, height and width attribute in the svg file and assign [min-x, min-y, height, width]. If none of these are present we display an error in the console.
        if (svgFile.getAttribute("viewBox")) {
            this.viewBox = svgFile.getAttribute("viewBox").split(" ").map(
                function (num) {
                    return +num;
                }
            );
        } else if (svgFile.getAttribute("height") && svgFile.getAttribute("width")) {
            var minX = parseInt(svgFile.getAttribute("min-x")) || 0;
            var minY = parseInt(svgFile.getAttribute("min-y")) || 0;
            this.viewBox = [minX, minY, parseInt(svgFile.getAttribute("width")), parseInt(svgFile.getAttribute("height"))];
        }

        if(!this.viewBox || this.viewBox.length != 4){
            console.log("SVG file is missing the viewBox attribute");
            return ;
        }

        this.render();


        // Add SVG stylesheet to the document to get the css rules
        var styleSheet = {}
        if(svgFile.getElementsByTagName("style").length > 0){
            document.getElementsByTagName("head")[0].append(svgFile.getElementsByTagName("style")[0])
            // Get the SVG stylesheet rules and remove the style tag from document
            var svgStyleSheet = document.styleSheets[document.styleSheets.length - 1].cssRules;
            var styleTags = document.getElementsByTagName("style");
            styleTags[styleTags.length - 1].remove();

            // Parsing the css class rules
            for (var j = 0; j < svgStyleSheet.length; j++) {
                var className = svgStyleSheet[j].selectorText.replace(".", ""),
                    index = 0,
                    attr,
                    value;

                styleSheet[className] = {};
                while (svgStyleSheet[j].style[index]) {
                    attr = svgStyleSheet[j].style[index];
                    value = svgStyleSheet[j].style[attr];
                    styleSheet[className][attr] = value;
                    index += 1;
                }
            }
        }

        // Parsing child nodes in SVG
        var svgElems = svgFile.childNodes || [];

        for (var i = 0; i < svgElems.length; i++) {

            if (!svgElems[i].getAttribute) { continue; }
            // if (svgElems[i].getAttribute("id") == null) { continue; }

            var node = svgElems[i];
            // var groupID = svgElems[i].getAttribute("id") || Date.parse(new Date()) + parseInt(Math.random() * 1000);
            var className = node.getAttribute("class") || "";
            var attrs = styleSheet[className] ? JSON.parse(JSON.stringify(styleSheet[className])) : {};
            // var anatomy = node.getAttribute("id");
            // var group = this.createAnnotationGroup(groupID, anatomy);
            switch (node.nodeName) {
                case "g":
                    this.parseSVGNodes(node.childNodes, styleSheet, node);
                    break;
                case "path":
                case "circle":
                case "polyline":
                case "polygon":
                case "rect":
                case "line":
                case "arrowline":
                case "foreignObject":
                    this.parseSVGNodes([node], styleSheet, node);
                    break;
                // Added the defs case to handle the definition of markers. We just skip the definition as
                // they get added while creating the annotation in the annotation-group.js
                case "defs":
                    break;
                case "scale":
                    this.imgScaleX = +node.getAttribute("x") || this.imgScaleX;
                    this.imgScaleY = +node.getAttribute("y") || this.imgScaleY;
                    break;
            }
        }

        // sort the groups based on their anatomy value
        var annotList = Object.keys(this.groups).sort(function (keyA, keyB) {
            var anatA = self.groups[keyA].anatomy,
                anatB = self.groups[keyB].anatomy;
            return (anatA > anatB) ? 1 : ((anatA < anatB) ? -1 : 0);
        }).map(function (id) {
            // create the list of annotations that UI has to display
            var group = self.groups[id];
            return {
                svgID: self.id,
                groupID: group.id,
                anatomy : group.anatomy,
                description : group.description,
                stroke: group.stroke
            }
        });

        // update the annotation list
        // NOTE this has to be here, because the stroke value changes will
        //      processing the annotation list. We cannot send this right away
        this.dispatchEvent('updateAnnotationList', annotList);
    }

    /**
     * Checks all the style attributes in the node and returns the in the form of a string
     * @param {object} node
     * @return {string} the returned value is a string that is similar to the 'style' attribute of a node i.e. style in a svg node.
     */
    this.getStyleAttributes = function (node) {

        styleAttributeList = parent.config.constants.STYLE_ATTRIBUTE_LIST;

        styleAttributeString = '';

        for (let i = 0; i < styleAttributeList.length; i++) {
            if (node.getAttribute(styleAttributeList[i])) {
                value = node.getAttribute(styleAttributeList[i]);
                styleAttributeString += styleAttributeList[i] + ':' + value + ';';
            }
        }
        return styleAttributeString;
    }

    /**
     * Take the properties from the parent style and appends them to the child node if they are missing from the child.
     * @param {string} parentStyle
     * @param {string} selfStyle
     * @return {string}
     */
    this.mergeWithParentStyle = function (parentStyle, selfStyle) {


        if (parentStyle != '') {
            parentStyle = this.annotationUtils.styleStringToObject(parentStyle);
            selfStyle = this.annotationUtils.styleStringToObject(selfStyle);

            for (let key in parentStyle) {
                if (!selfStyle[key]) {
                    selfStyle[key] = parentStyle[key];
                }
            }

            return this.annotationUtils.styleObjectToString(selfStyle);
        }

        return selfStyle;
    }

    /**
     * Returns the node ID, which can is defined by the following logic: if the node has an ID return that else check for the name attribute in the node. If name is not present then check if the parent of that node has an ID, if yes then return that. In case non of these are present, then return a constant.
     * @param {object} node
     * @param {object} parentNode
     * @return {string}
     */
    this.getNodeID = function(node, parentNode) {
        return node.getAttribute("id") || node.getAttribute("name") || parentNode.getAttribute("id") || parent.config.constants.UNKNOWN_ANNNOTATION;
    }

    /**
     * This function return the set of attributes in the form of an object {attr: value}, from the input object which has otehr properties as well.
     * @param {object} node
     * @return {object}
     */
    this.getNodeAttributes = function(node) {
        attributes = node.attributes || {};
        var obj = {}
        for (i = 0; i < attributes.length; i++) {
            obj[attributes[i]['name']] = attributes[i]['nodeValue'];
        }   
        return obj;
    }


    this.parseSVGNodes = function (nodes, styleSheet, parentNode){

        var parentStyle = '';
        if (parentNode) {
            parentStyle = parentNode.getAttribute("style") || '';
        } else {
            parentNode = {};
        }


        for (var i = 0; i < nodes.length; i++) {

            if (!nodes[i].getAttribute) { continue; }

            var node = nodes[i];
            var id = this.getNodeID(node, parentNode);
            node.setAttribute("id", id);
            var anatomy = id.split(",").length > 1 ? id.split(",")[1] + " ("+id.split(",")[0]+")" : id;
            var className = node.getAttribute("class") || "";
            var group = null;

            var selfStyle = node.getAttribute("style") || "";
            if (parentStyle != '') {
                selfStyle = this.mergeWithParentStyle(parentStyle, selfStyle);
                node.setAttribute("style", selfStyle);
            }

            var attrs = this.annotationUtils.styleStringToObject(node.getAttribute("style"));
            for (attr in attrs) {
                node.setAttribute(attr, attrs[attr]);
            }
            // var attrs = styleSheet[className] ? JSON.parse(JSON.stringify(styleSheet[className])) : {};

            switch (node.nodeName) {
                case "g":
                    this.parseSVGNodes(node.childNodes, styleSheet, node);
                    break;
                case "path":
                case "circle":
                case "polyline":
                case "polygon":
                case "rect":
                case "foreignObject":
                    if(id !== "undefined"){
                        group = this.groups.hasOwnProperty(id) ? this.groups[id] : this.createAnnotationGroup(id, anatomy);
                        annotation = group.addAnnotation(node.nodeName, node);
                        console.log(annotation);
                        annotation.setAttributesByJSON(this.getNodeAttributes(node));
                        annotation.renderSVG(this);
                    }
                    break;
                // Separate case for line type as we need to check if the annotation is line or arrow line
                case "line":
                    if (id !== "undefined") {
                        group = this.groups.hasOwnProperty(id)
                        ? this.groups[id]
                        : this.createAnnotationGroup(id, anatomy);
                        
                        // Check if the line contains marker-end attribute, which makes it an arrow line
                        if (node.getAttribute("data-subtype") != null) {
 
                            // Create a different marker-id for each SVG with arrow line as the stroke colour would be different
                            arrowSubtype = node.getAttribute("data-subtype");
                            arrowlineAttributes = this.getNodeAttributes(node);
                            annotation = group.addAnnotation("arrowline", arrowSubtype, arrowlineAttributes);
                            annotation.setAttributesByJSON(arrowlineAttributes);
                            annotation.renderSVG("arrowline");

                        } else {
                            annotation = group.addAnnotation(node.nodeName);
                            annotation.setAttributesByJSON(this.getNodeAttributes(node));
                            annotation.renderSVG(this);
                        }
                    }
                    break;
                case "scale":
                    this.imgScaleX = +node.getAttribute("x") || this.imgScaleX;
                    this.imgScaleY = +node.getAttribute("y") || this.imgScaleY;
                    break;
            }
        }
    }

    this.render = function(){
        if(this.svg != null) {
            return;
        }

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");        
        
        svg.setAttribute("class", "annotationSVG");
        svg.setAttribute("viewBox", this.getViewBox().join(" "));
        svg.setAttribute("scale", this.scale);
        svg.setAttribute("ignoreReferencePoint", this.ignoreReferencePoint);
        svg.setAttribute("ignoreDimension", this.ignoreDimension);
        
        if(this.parent.svg){
            this.parent.svg.append(svg);
        }

        this.svg = svg;
    }

    // Remove all the annotations
    this.removeAllGroups = function(){
        var groupID;
        var group;

        for(groupID in this.groups){
            group = this.groups[groupID]

            group.removeAllAnnotations();

            // remove svg element
            group.svg.remove();

            delete this.groups[groupID];
        }
    }

    // Remove annotation from a group
    this.removeAnnotationByGraphID = function(groupID, graphID, userData){

        if(userData.type == "TEXT"){
            userData.annotation.transform();
            return;
        }
        if(this.groups.hasOwnProperty(groupID)){
            var group = this.groups[groupID];
            group.removeAnnotationByID(graphID);
        }
    }

    this.showGroupBorder = function(data){
        var w = data.x2 - data.x1 > this.width ? this.width : data.x2 - data.x1;
        var h = data.y2 - data.y1 > this.height ? this.height : data.y2 - data.y1;
        var x1 = (data.x1 < 0) ? 0 : data.x1;
        var y1 = (data.y1 < 0) ? 0 : data.y1;

        d3.select(this.svg)
            .append("rect")
            .attr("class", "groupBorder")
            .attr("x", x1)
            .attr("y", y1)
            .attr("width", w)
            .attr("height", h)
            .attr("fill", "none")
            .attr("stroke-width", "2px")
            .attr("stroke", "yellow")
    }

    this.setGroupAttributes = function(data){

        if(this.groups.hasOwnProperty(data.groupID)){
            var group = this.groups[data.groupID];
            group.setAttributesByJSON(data);
        }
    }

    // Unhighlight current group when user hover on other group
    this.unHighlightCurrentGroup = function(hoverGroupID){
        if(this.currentGroupID != "" && this.currentGroupID != hoverGroupID){
            if(this.groups.hasOwnProperty(this.currentGroupID)){
                var group = this.groups[this.currentGroupID];
                group.unHighlightAll();
            }
        }
    }

}
