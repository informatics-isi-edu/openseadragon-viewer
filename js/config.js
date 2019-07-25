var _config = {
    toolbar : {
        elems : {
            containerId : "menuContainer",
            navMenuId : "navMenu",
            navMenuContentId : "navMenuContent"
        },
        navMenu : {
            channelList : {
                name : "Channel Filtering",
                tooltip : "Channel filtering",
                iconElem : "<i class='fa fa-sliders'></i>"
            },
            annotationList : {
                name : "Annotations",
                tooltip : "Open the annotation list",
                iconElem: "<i class='fa fa-edit'></i>"
            },
            zoomIn : {
                name : "Zoom In",
                tooltip : "Zoom in",
                iconElem: "<i class='fa fa-search-plus'></i>"
            },
            zoomOut : {
                name : "Zoom Out",
                tooltip : "Zoom out",
                iconElem: "<i class='fa fa-search-minus'></i>"
            },
            drawLine: {
                name : "Line",
                tooltip : "Draw a line",
                iconElem: "<i class='fa fa-pencil'></i>"
            },
            drawRectangle: {
                name : "Rectangle",
                tooltip : "Draw a rectangle",
                iconElem: "<i class='fa fa-square-o'></i>"
            },
            drawCircle: {
                name : "Circle",
                tooltip : "Draw a circle",
                iconElem: "<i class='fa fa-circle-o'></i>"
            },
            // exportSVG : {
            //     name : "Save as a SVG File",
            //     tooltip : "Export annotations to a SVG file",
            //     iconElem: "<i class='fa fa-download'></i>"
            // } 
        }
    },
    viewer : {
        svg: {
            id : 'annotationContainer'
        },
        osd: {
            id: 'openseadragonContainer',
            prefixUrl: "images/",
            showNavigator: true,
            showZoomControl: false,
            showHomeControl: false,
            showFullPageControl: false,
            panHorizontal: true,
            panVertical: true,
            zoomPerClick : 1,
            // tileSources : {}
        },
        scalebar : {
            type: OpenSeadragon.ScalebarType.MAP,
            pixelsPerMeter: 0,
            minWidth: "75px",
            location: OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT,
            xOffset: 5,
            yOffset: 10,
            stayInsideImage: true,
            color: "rgb(153, 0, 0)",
            fontColor: "rgb(0, 0, 0)",
            backgroundColor: "rgba(204, 204, 204, 0.7)",
            fontSize: "small",
            barThickness: 3
        }
    }
};