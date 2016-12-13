
/* channel filtering event/message linkup with chaise */

// save the propertyList to the backend
// mType='filteringPropertyList'
function uploadFilteringPropertyList(mType, pData) {
    if (enableEmbedded) {
        window.top.postMessage({messageType: mType, content: pData}, window.location.origin);
    }
}

// mType='dismissChannels'
function dismissChannelsPullOut(mType,pData) {
    if (enableEmbedded) {
        window.top.postMessage({messageType: mType, content: pData}, window.location.origin);
    }
}

function event_loadFilteringPropertyList(messageType, data) {
    var propertyToLoad = [];
    data.map(function(item) {
        var p=JSON.parse(item);
        propertyToLoad.push(p);
    });
    loadPropertyList(propertyToLoad);
}

/*********************************************************/
// An event listener to capture incoming messages from Chaise
/*********************************************************/
window.addEventListener('message', function(event) {
//window.console.log("add channel event listener for incoming mesg from chaise..");
    if (event.origin === window.location.origin) {
        var messageType = event.data.messageType;
        var data = event.data.content;
        switch (messageType) {
            case 'loadFilteringPropertyList':
                event_loadFilteringPropertyList(messageType, data);
                break;
            case 'filterChannels':
                channelsClick();
                break;
            default:
                console.log('No action performed from channel handler. Received message event: ', messageType);
        }
    } else {
        console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
    }
});


