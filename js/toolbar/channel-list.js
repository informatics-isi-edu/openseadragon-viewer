function ChannelList(parent) {

    var _self = this;

    this.elem = null;
    this.collection = {};
    this.parent = parent || null;

    // Add new channel items
    this.add = function(items) {
        var id,
            item,
            i;

        for (i = 0; i < items.length; i++) {
            id = items[i].osdItemId;

            if (!this.collection.hasOwnProperty(id)) {
                item = new ChannelItem({
                    name: items[i]["name"],
                    contrast: items[i]["contrast"],
                    brightness: items[i]["brightness"],
                    gamma: items[i]["gamma"],
                    hue: items[i]["hue"],
                    deactivateHue: items[i]["deactivateHue"],
                    osdItemId: id,
                    isDisplay: items[i]["isDisplay"],
                    parent: _self
                });

                this.collection[id] = item;

                if (this.elem != null) {
                    item.render();
                    this.elem.querySelector(".groups").appendChild(item.elem);
                };
            }
        }
    }

    this.replaceList = function(items) {
        this.collection = {};
        this.elem = null;
        this.add(items);
        this.render();
    }

    this.updateList = function (items) {
        this.add(items);
    }

    // Dispatch the event to the parent
    this.dispatchEvent = function(type, data) {
        this.parent.dispatchEvent(type, data);
    }

    this.onClickedMenuHandler = function() {
        _self.parent.onClickedMenuHandler("channelList")
        _self.parent.dispatchEvent("hideChannelList");
    }

    this.expandAllChannels = function (event) {
        for (var id in _self.collection) {
            _self.collection[id].onClickToggleExpand(event, true);
        }
    };

    this.collapseAllChannels = function (event) {
        for (var id in _self.collection) {
            _self.collection[id].onClickToggleExpand(event, false);
        }
    };

    this.showAllChannels = function (event) {
        for (var id in _self.collection) {
            _self.collection[id].onClickToggleDisplay(event, true);
        }
    };

    this.hideAllChannels = function (event) {
        for (var id in _self.collection) {
            _self.collection[id].onClickToggleDisplay(event, false);
        }
    };

    this.resetAllChannels = function (event) {
        for (var id in _self.collection) {
            _self.collection[id].resetChannelSettings(event);
        }
    }

    // Render the view
    this.render = function() {

        var id,
            collection = this.collection,
            listElem = document.createElement("div");

        listElem.setAttribute("class", "channelList");
        if (collection, Object.keys(collection).length === 0 && collection.constructor === Object) {
            listElem.innerHTML = [
                "<div class='title-container'>",
                    "<span class='title'>Channels</span>",
                "</div>",
                "<div class='groups'> No Channels found</div>"
            ].join("");
        } else {
            listElem.innerHTML = [
                "<div class='title-container'>",
                    "<div class='title-content'>",
                        "<span class='title'>Channels</span>",
                    "</div>",
                    "<div class='all-channel-controls'>",
                        "<span data-tippy-content='Expand all channel controls' class='channels-control fa fa-caret-down' id='expand-all-channels'></span>",
                        "<span data-tippy-content='Collapse all channel controls' class='channels-control fa fa-caret-up' id='collapse-all-channels'></span>",
                        "<span data-tippy-content='Display all channels' class='channels-control fa fa-eye' id='show-all-channels'></span>",
                        "<span data-tippy-content='Hide all channels' class='channels-control fa fa-eye-slash' id='hide-all-channels'></span>",
                        "<span data-tippy-content='Reset all channel settings' class='channels-control fas fa-undo' id='reset-all-channels'></span>",
                    "</div>",
                "</div>",
                "<div class='groups'></div>"
            ].join("");
        }
        // console.log("Collection are herre",  collection,Object.keys(collection).length === 0 && collection.constructor === Object);
        for (id in collection) {
            if (collection[id].elem == null) {
                collection[id].render();
            }
            listElem.querySelector(".groups").appendChild(collection[id].elem);
        }

        this.elem = listElem;

        this.elem.querySelector('#expand-all-channels').addEventListener('click', this.expandAllChannels);

        this.elem.querySelector('#collapse-all-channels').addEventListener('click', this.collapseAllChannels);

        this.elem.querySelector('#show-all-channels').addEventListener('click', this.showAllChannels);

        this.elem.querySelector('#hide-all-channels').addEventListener('click', this.hideAllChannels);

        this.elem.querySelector('#reset-all-channels').addEventListener('click', this.resetAllChannels);

    }
}
