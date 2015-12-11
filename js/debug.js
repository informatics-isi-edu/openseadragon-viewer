
var debug=0;
var myDebugWin;

function _showDebug (name) {
     var debugwin = window.open ("", name,
         "left=0, top=0, width=500, height=600, titlebar=yes,  scrollbars=yes,"
          + "status=yes, resizable=yes");
     debugwin.document.open();
     debugwin.document.write (
         "<html><head><title>" + name + "</title></head><body><pre>\n");
     return (debugwin);
}

function _printDebug (winHandle, text) {
     if (winHandle && !winHandle.closed) {
         winHandle.document.write (text + "\n");
     }
}

function printDebug(text) {
    if (!debug) return;
    if ((myDebugWin == undefined) || (myDebugWin.closed)) {
             myDebugWin = _showDebug ("myDebugWin");
    }
    _printDebug( myDebugWin, text);
}


