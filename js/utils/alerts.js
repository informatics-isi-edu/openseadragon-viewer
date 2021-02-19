function AlertService(utils) {
    var _self = this;

    this._utils = utils;

    this.showPseudoColorAlert = function (channel) {
        // TODO should be moved to a strings.js
        var message = "Given Pseudo Color (" + _self._utils.colorRGBToHex(channel.rgb) + ") for channel \"" + channel.name + "\" is invalid and therefore ignored.";

        OSDViewer.dispatchEvent( "showAlert", { type: "warning", message: message })
    }

    this.showAlert = function (message) {
        OSDViewer.dispatchEvent("showAlert", { type: "warning", message: message })
    }
}


function ErrorService(utils) {
    var _self = this;

    this._utils = utils;

    this.showPopupError = function (header, message, isDismissible, clickActionMessage) {
        OSDViewer.dispatchEvent("showPopupError", {
            header: header,
            message: message,
            isDismissible: isDismissible,
            clickActionMessage: clickActionMessage
        });
    }
}
