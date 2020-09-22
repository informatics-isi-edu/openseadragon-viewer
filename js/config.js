var _config = {
    toolbar : {
        elems : {
            containerId : "menuContainer",
            navMenuContentId : "navMenuContent",
            drawToolContainerId : "drawToolContainer"
        }
    },
    viewer : {
        iiif : {
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
            // tileSources : {},
            showNavigator: true //thumbnail
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
            showNavigator: true //thumbnail
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
        constants: {
          UNKNOWN_ANNNOTATION: 'UNKNOWN',
          STYLE_ATTRIBUTE_LIST: ['alignment-baseline', 'baseline-shift', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cursor', 'direction', 'display', 'dominant-baseline', 'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering', 'kerning', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'opacity', 'overflow', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'transform', 'transform-origin', 'unicode-bidi', 'vector-effect', 'visibility', 'word-spacing', 'writing-mode'],
          DEFAULT_SVG_STROKE_WIDTH: '1px',
          DEFAULT_LINE_THICKNESS: '1px',
          DEFAULT_SVG_STROKE: 'red',
          DEFAULT_SVG_VECTOR_EFFECT: "non-scaling-stroke"
        },
    },
};
