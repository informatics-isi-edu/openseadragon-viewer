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
    this.annotationColor = null;
    this.currentGroupID = "";

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
            this.dispatchEvent('updateAnnotationList', [{
                svgID : this.id,
                groupID : id,
                anatomy : anatomy,
                description : description
            }]);
            return group;
        }
    }

    // Create a new path/rect/circle object for users to draw
    this.createAnnotationObject = function(groupID, type, attrs){

        var group,
            annotation;

        if(this.groups.hasOwnProperty(groupID)){
            // Find corresponding group
            group = this.groups[groupID];

            // Start to draw annotation
            annotation = group.addAnnotation(type);
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
                attrs : attrs
            }) 
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
    this.exportToSVG = function(groupID = null){
        var rst = [];
        var svg = "";
        var imgScaleX = (this.imgScaleX) ? this.imgScaleX : 1;
        var imgScaleY = (this.imgScaleY) ? this.imgScaleY : 1;
        var annotationColor = this.annotationColor || "";

        // return matched group SVG content only if groupID provided
        if(groupID){
            if(this.groups.hasOwnProperty(groupID)){
                svg += "<svg viewBox='"+this.getViewBox().join(" ")+"' annotationColor='"+annotationColor+"'  xmlns='http://www.w3.org/2000/svg'  xmlns:xlink='http://www.w3.org/1999/xlink'>";
                svg += "<scale x='"+imgScaleX+"' y='"+imgScaleY+"'/>";
                svg += this.groups[groupID].exportToSVG();
                svg += "</svg>";
                rst.push({
                    svgID : this.id,
                    groupID : groupID,
                    numOfAnnotations : this.groups[groupID].getNumOfAnnotations(),
                    svg : svg
                });
            }
        }
        // return all group content if groupID is not provided
        else{
            for(groupID in this.groups){
                svg += "<svg viewBox='"+this.getViewBox().join(" ")+"'  xmlns='http://www.w3.org/2000/svg'  xmlns:xlink='http://www.w3.org/1999/xlink'>";
                svg += "<scale x='"+imgScaleX+"' y='"+imgScaleY+"'/>";
                svg += this.groups[groupID].exportToSVG();
                svg += "</svg>";
                rst.push({
                    groupID : groupID,
                    svg : svg
                });
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

        if(!svgFile){ return; }

        this.viewBox = svgFile.getAttribute("viewBox").split(" ").map(
            function(num){ 
                return +num;
            }
        );
        
        if(this.viewBox.length != 4){ 
            console.log("SVG file is missing the viewBox attribute");
            return ; 
        }

        this.render();

        // Get default drawing color for annotation  
        if(svgFile.getAttribute("annotationColor") !== null){
            this.annotationColor = svgFile.getAttribute("annotationColor");
        };

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
                    this.parseSVGNodes(node.childNodes, styleSheet);
                    break;
                case "path":
                case "circle":
                case "polyline":
                case "polygon":
                case "rect":
                    this.parseSVGNodes([node]);
                    // annotation = group.addAnnotation(node.nodeName);
                    // annotation.setAttributesBySVG(node);
                    // annotation.renderSVG(this);
                    break;
                case "scale":
                    this.imgScaleX = +node.getAttribute("x") || this.imgScaleX;
                    this.imgScaleY = +node.getAttribute("y") || this.imgScaleY;
                    break;
            }

            // Setting each group's boundary
            // for (var id in this.groups) {
            //     var group = this.groups[id];
            //     group.updateDiagonalPoints();
            // };
        }
    }

    this.parseSVGNodes = function(nodes, styleSheet){
        // if (group == null) { return }

        for (var i = 0; i < nodes.length; i++) {

            if (!nodes[i].getAttribute) { continue; }

            var node = nodes[i];
            var id = node.getAttribute("name") || "Unknown Anatomy";
            var anatomy = id.split(",").length > 1 ? id.split(",")[1] + " ("+id.split(",")[0]+")" : id;
            var className = node.getAttribute("class") || "";
            var group = null;
            // var attrs = styleSheet[className] ? JSON.parse(JSON.stringify(styleSheet[className])) : {};

            switch (node.nodeName) {
                case "g":
                    this.parseSVGNodes(node.childNodes, styleSheet);
                    break;
                case "path":
                case "circle":
                case "polyline":
                case "polygon":
                case "rect":
                    if(id !== "undefined"){
                        group = this.groups.hasOwnProperty(id) ? this.groups[id] : this.createAnnotationGroup(id, anatomy);
                        annotation = group.addAnnotation(node.nodeName);
                        annotation.setAttributesBySVG(node);
                        annotation.renderSVG(this);
                        // Get default theme color as annotation default color
                        if(!this.annotationColor && annotation.getAttribute("stroke")){
                            this.annotationColor = annotation.getAttribute("stroke");
                        };
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
    this.removeAnnotationByGraphID = function(groupID, graphID){
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

    // Set default color for drawing annotations
    this.setAnnotationColor = function(color){
        this.annotationColor = color ? color : this.annotationColor;
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




