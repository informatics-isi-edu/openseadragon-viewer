var _config = {
    toolbar : {
        elems : {
            containerId : "menuContainer",
            navMenuContentId : "navMenuContent"
        }
    },
    viewer : {
        tiff : {
          svg: {
              id : 'annotationContainer'
          },
          osd: { // Single and multiple
            id: 'openseadragonContainer',
            // prefixUrl: "images/",
            // collectionRows: 1,
            ajaxWithCredentials : true,
        	  maxZoomPixelRatio: 1,
        	// prefixUrl: "/openseadragon/images/",
            // showNavigator: false,
            showZoomControl: false,
            showHomeControl: false,
            showFullPageControl: false,
            // panHorizontal: true,
            // panVertical: true,
            // zoomPerClick : 1,
            crossOriginPolicy: "Anonymous",
            constrainDuringPan: true,
            // collectionMode: true,
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
        },
        rest: {
          osd: {
            id: 'openseadragonContainer',
            // showNavigator: false,
            showZoomControl: false,
            showHomeControl: false,
            showFullPageControl: false,
            constrainDuringPan: true,
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
    },
};
