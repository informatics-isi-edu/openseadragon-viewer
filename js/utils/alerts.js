function AlertService() {
    var _self = this;

    this.showPseudoColorAlert = function (channel) {
        // TODO should be moved to a strings.js
        var message = "Given Pseudo Color (" + OSDViewer.utils.colorRGBToHex(channel.rgb) + ") for channel \"" + channel.name + "\" is invalid and therefore ignored.";

        OSDViewer.dispatchEvent( "showAlert", { type: "warning", message: message })
    }

    this.showAlert = function (message) {
        OSDViewer.dispatchEvent("showAlert", { type: "warning", message: message })
    }
}


function ErrorService() {
    var _self = this;

    this.showPopupError = function (header, message, isDismissible, clickActionMessage) {
        OSDViewer.dispatchEvent("showPopupError", {
            header: header,
            message: message,
            isDismissible: isDismissible,
            clickActionMessage: clickActionMessage
        });
    }
}
