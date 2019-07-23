function AnnotationSVG(id, svgFile, parent){
    this.id = id;
    this.svg = null;
    this.parent = parent;
    // reference point to the actual images
    this.p1 = null;
    this.p2 = null;
    this.groups = {};
    this.isSelected = false;
    this.currentGroupID = "";

    if(svgFile){
        this.parseSVGFile(svgFile);
    }
}


// Create drawing area for grouping annotations with same id
AnnotationSVG.prototype.createAnnotationGroup = function (id, anatomy, description) {
    // Check if the area has created
    id = id ? id : Date.parse(new Date());
    var isGroupEmpty = this.groups.hasOwnProperty(id) ? false : true;
    var group = null;

    // Check if annotation id has already existed and create one if not
    if (isGroupEmpty) {
        group = new AnnotationGroup(id, anatomy, description, this);
        group.render();
        this.groups[id] = group;
        this.dispatchEvent('UpdateAnnotationList', [{
            svgID : this.id,
            groupID : id,
            anatomy : anatomy,
            description : description
        }]);
        return group;
    }
}

// Change the group visibility
AnnotationSVG.prototype.changeVisibility = function(data){
    if(this.groups.hasOwnProperty(data.id)){
        var group = this.groups[data.id];
        group.setDisplay(data.isDisplay);
    }
}

// Change all groups visibility
AnnotationSVG.prototype.changeAllVisibility = function(isDisplay){
    var groupID;
    for (groupID in this.groups) {
        group = this.groups[groupID];
        group.setDisplay(isDisplay);
    }
}

AnnotationSVG.prototype.changeSelectedGroup = function(data){

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
    
            data["x1"] = this.p1.x + group["x1"] * this.xUnit;
            data["x2"] = this.p1.x + group["x2"] * this.xUnit;
            data["y1"] = this.p1.y + group["y1"] * this.yUnit;
            data["y2"] = this.p1.y + group["y2"] * this.yUnit;

            this.showGroupBorder({
                x1 : group["x1"],
                y1 : group["y1"],
                x2 : group["x2"],
                y2 : group["y2"]
            });
        } 
    }
      
    
    data["svgID"] = this.id;
    data["groupID"] = this.currentGroupID;

}

AnnotationSVG.prototype.dispatchEvent = function(type, data){
    switch(type){
        // Change the selecting annotation 
        case "OnClickChangeSelectingAnnotation":
            this.changeSelectedGroup(data);
            this.parent.dispatchEvent(type, data);
            break;
        case "OnMouseoverShowTooltip":
            this.showGroupBorder(data);
            this.parent.dispatchEvent(type, data);
            break;
        case "OnMouseoutHideTooltip":
            this.hideGroupBorder();
            this.parent.dispatchEvent(type, data);
            break;
        default:
            this.parent.dispatchEvent(type, data);
            break;
    }
    
}

// Hide border of annotation group
AnnotationSVG.prototype.hideGroupBorder = function () {
    d3.select(this.svg)
        .selectAll("rect.groupBorder")
        .remove();
}

AnnotationSVG.prototype.parseSVGFile = function(svgFile){

    if(!svgFile){ return; }

    this.viewBox = svgFile.getAttribute("viewBox");
    this.width = +this.viewBox.split(" ")[2];
    this.height = +this.viewBox.split(" ")[3];
    this.x = svgFile.getAttribute("x");
    this.y = svgFile.getAttribute("y");
    this.p1 = svgFile.getAttribute("p1").split(",");
    this.p2 = svgFile.getAttribute("p2").split(",");
    this.p1 = new OpenSeadragon.Point(+this.p1[0], +this.p1[1]);
    this.p2 = new OpenSeadragon.Point(+this.p2[0], +this.p2[1]);
    this.xUnit = Math.abs(this.p2.x - this.p1.x) / this.width;
    this.yUnit = Math.abs(this.p2.y - this.p1.y) / this.height;

    this.render();

    // Add SVG stylesheet to the document to get the css rules
    document.getElementsByTagName("head")[0].append(svgFile.getElementsByTagName("style")[0])

    // Get the SVG stylesheet rules and remove the style tag from document
    var styleSheet = {}
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

    // Parsing child nodes in SVG
    var svgElems = svgFile.childNodes || [];

    for (var i = 0; i < svgElems.length; i++) {

        if (!svgElems[i].getAttribute) { continue; }
        if (svgElems[i].getAttribute("id") == null) { continue; }

        var node = svgElems[i];
        var groupID = svgElems[i].getAttribute("id") || Date.parse(new Date()) + parseInt(Math.random() * 1000);
        var className = node.getAttribute("class") || "";
        var attrs = styleSheet[className] ? JSON.parse(JSON.stringify(styleSheet[className])) : {};
        var anatomy = node.getAttribute("id");
        var group = this.createAnnotationGroup(groupID, anatomy);

        switch (node.nodeName) {
            case "g":
                this.parseSVGNodes(node.childNodes, styleSheet, group);
                break;
            case "path":
                annotation = group.addAnnotation("SCRIBBLE")
                attrs["d"] = node.getAttribute("d");
                annotation.setAttributesByJSON(attrs);
                annotation.renderSVG(this);
                break;
            case "rect":
                annotation = group.addAnnotation("RECT");
                attrs["height"] = +node.getAttribute("height");
                attrs["width"] = +node.getAttribute("width");
                attrs["x"] = +node.getAttribute("x");
                attrs["y"] = +node.getAttribute("y");
                annotation.setAttributesByJSON(attrs);
                annotation.renderSVG(this);
                break;
        }

        // Setting each group's boundary
        for (var id in this.groups) {
            var group = this.groups[id];
            group.updateDiagonalPoints();
        };
    }
}

AnnotationSVG.prototype.parseSVGNodes = function(nodes, styleSheet, group){
    if (group == null) { return }

    for (var i = 0; i < nodes.length; i++) {

        if (!nodes[i].getAttribute) { continue; }

        var node = nodes[i];
        var className = node.getAttribute("class") || "";
        var attrs = styleSheet[className] ? JSON.parse(JSON.stringify(styleSheet[className])) : {};

        switch (node.nodeName) {
            case "g":
                this.parseSVGNodes(node.childNodes, styleSheet, group);
                break;
            case "path":
                annotation = group.addAnnotation("SCRIBBLE")
                attrs["d"] = node.getAttribute("d");
                annotation.setAttributesByJSON(attrs);
                annotation.renderSVG(this);
                break;
            case "rect":
                annotation = group.addAnnotation("RECT");
                attrs["height"] = +node.getAttribute("height");
                attrs["width"] = +node.getAttribute("width");
                attrs["x"] = +node.getAttribute("x");
                attrs["y"] = +node.getAttribute("y");
                annotation.setAttributesByJSON(attrs);
                annotation.renderSVG(this);
                break;
        }
    }

    
}

AnnotationSVG.prototype.render = function(){
    if(this.svg != null) {
        return;
    }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    svg.setAttribute("class", "annotationSVG");
    svg.setAttribute("viewBox", this.viewBox);
    svg.setAttribute("x", this.x);
    svg.setAttribute("y", this.y);
    svg.setAttribute("p1", this.p1.x + ","+ this.p1.y);
    svg.setAttribute("p2", this.p2.x + ","+ this.p2.y);

    if(this.parent.svg){
        this.parent.svg.append(svg);
    }
    
    this.svg = svg;
}

AnnotationSVG.prototype.showGroupBorder = function(data){
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

AnnotationSVG.prototype.setGroupAttributes = function(data){

    if(this.groups.hasOwnProperty(data.groupID)){
        var group = this.groups[data.groupID];
        group.setAttributesByJSON(data);
    }
}

