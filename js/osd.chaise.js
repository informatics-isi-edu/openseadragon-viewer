
/* event/message linkup with chaise */

// An event listener to capture messages from Chaise
window.addEventListener('message', function(event) {
    if (event.origin === window.location.origin) {
        var messageType = event.data.messageType;
        var data = event.data.content;
        switch (messageType) {
            case 'annotationsList':
                var annotationsToLoad = {"annoList":[]};
                data.map(function formatAnnotationObj(annotation) {
                    var annotationObj = {
                        "type": "openseadragon_dzi",
                        "id": null,
                        "event": "INFO",
                        "data": {
                            "src": "dzi://openseadragon",
                            "text": annotation.comments,
                            "shapes": [
                                {
                                    "type": "rect",
                                    "geometry": {
                                        "x": annotation.coords[0],
                                        "y": annotation.coords[1],
                                        "width": annotation.coords[2],
                                        "height": annotation.coords[3]
                                    },
                                    "style": {}
                                }
                            ],
                            "context": annotation.context_uri
                        }
                    };
                    annotationsToLoad.annoList.push(annotationObj);
                });
                readAll(annotationsToLoad);
                break;
            case 'highlightAnnotation':
                var annotationObj = {
                    "src": "dzi://openseadragon",
                    "text": data.comments,
                    "shapes": [
                        {
                            "type": "rect",
                            "geometry": {
                                "x": data.coords[0],
                                "y": data.coords[1],
                                "width": data.coords[2],
                                "height": data.coords[3]
                            },
                            "style": {}
                        }
                    ],
                    "context": data.context_uri
                };
                centerAnnoByHash(getHash(annotationObj));
                break;
            default:
                window.console.log('XXX Invalid message type. No action performed.'+messageType);
        }
    } else {
        console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
    }
});


// post outgoing events to chaise
function _postOutgoingEvent(mType, cData) {
    window.top.postMessage({messageType: mType, content: cData}, window.location.origin);
}
