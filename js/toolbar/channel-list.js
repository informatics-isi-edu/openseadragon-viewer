function ChannelList(parent) {

    var _self = this;

    this.elem = null;
    this.collection = {};
    this.parent = parent || null;
    this.showChannelNamesOnOSD = true;

    // Add new channel items
    this.add = function(items) {
        var id,
            item,
            i;

        for (i = 0; i < items.length; i++) {
            id = items[i].osdItemId;

            if (!this.collection.hasOwnProperty(id)) {
                item = new ChannelItem({
                    number: items[i]["number"],
                    name: items[i]["name"],
                    blackLevel: items[i]["blackLevel"],
                    whiteLevel: items[i]["whiteLevel"],
                    gamma: items[i]["gamma"],
                    saturation: items[i]["saturation"],
                    hue: items[i]["hue"],
                    displayGreyscale: items[i]["displayGreyscale"],
                    osdItemId: id,
                    isDisplay: items[i]["isDisplay"],
                    acls: items[i]["acls"],
                    parent: _self
                });

                this.collection[id] = item;

                if (this.elem != null) {
                    item.render();
                    this.elem.querySelector(".groups").appendChild(item.elem);
                }
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
    };

    this.saveAllChannels = function (event) {
        var data = [];

        var btn = _self.elem.querySelector("#save-all-channels");
        btn.className = "channels-control glyphicon glyphicon-refresh glyphicon-refresh-animate";

        for (var id in _self.collection) {
            if (_self.collection.hasOwnProperty(id) && _self.collection[id].acls.canUpdateConfig) {
                data.push(_self.collection[id].saveChannelSettings(event, true));
            }
        }

        _self.parent.dispatchEvent('updateChannelConfig', data);
    };

    this.saveAllChannelsDone = function (data) {
        // make sure the save-all button icon is correct
        var btn = _self.elem.querySelector("#save-all-channels");
        btn.className = "channels-control glyphicon glyphicon-saved";

        // hide the spinner for the individual channels
        data.channels.forEach(function (d) {
            var item;
            for (var k in _self.collection) {
                if (_self.collection[k].number === d.channelNumber) {
                    _self.collection[k].saveChannelSettingsDone(data.success);
                }
            }
        });
    }

    this.toggleChannelNames = function() {
        _self.showChannelNamesOnOSD = !_self.showChannelNamesOnOSD;
        _self.parent.dispatchEvent('toggleChannelNamesOverlay');

        var showChannelNamesDiv = document.getElementById('toggle-channel-names');

        if (_self.showChannelNamesOnOSD) {
            showChannelNamesDiv.innerHTML = 'Hide Channel Names'
        } else {
            showChannelNamesDiv.innerHTML = 'Show Channel Names'
        }

    }


    // Render the view
    this.render = function() {

        var id,
            collection = this.collection,
            listElem = document.createElement("div");

        var channelHamburger = [
            '<span class="dropdown">',
                '<button class="channel-hamburger-button" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">',
                    '<i class="channels-control fas fa-bars"></i>',
                '</button>',
                '<ul class="dropdown-menu" aria-labelledby="dropdownMenu1">',
                    '<li>',
                        '<span class="channel-hamburger-item" id="toggle-channel-names">',
                            'Hide Channel Names',
                        '</span>',
                    '</li>',
                '</ul>',
            '</span>'
        ]

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
                        "<span data-tippy-content='Hide the channel list' class='title' id='dismiss-channel-panel'>Channels</span>",
                    "</div>",
                    "<div class='all-channel-controls'>",
                        "<span data-tippy-content='Save the current settings for all the channels' class='channels-control glyphicon glyphicon-saved' id='save-all-channels'></span>",
                        "<span data-tippy-content='Reset settings of all the channels' class='channels-control fas fa-undo' id='reset-all-channels'></span>",
                        "<span data-tippy-content='Collapse all the channel controls' class='channels-control fa fa-caret-up' id='collapse-all-channels'></span>",
                        "<span data-tippy-content='Expand all the channel controls' class='channels-control fa fa-caret-down' id='expand-all-channels'></span>",
                        "<span data-tippy-content='Hide all the channels' class='channels-control fa fa-eye-slash' id='hide-all-channels'></span>",
                        "<span data-tippy-content='Display all the channels' class='channels-control fa fa-eye' id='show-all-channels'></span>",
                        channelHamburger.join(''),
                    "</div>",
                "</div>",
                "<div class='groups'></div>"
            ].join("");

            var canUpdateAtLeastOne  = false;
            for (id in collection) {
                if (collection.hasOwnProperty(id) && collection[id].acls.canUpdateConfig) {
                    canUpdateAtLeastOne = true;
                    break;
                }
            }
            listElem.querySelector("#save-all-channels").style.display = canUpdateAtLeastOne ? "inline-block" : "none";
        }
        // console.log("Collection are herre",  collection,Object.keys(collection).length === 0 && collection.constructor === Object);
        for (id in collection) {
            if (collection[id].elem == null) {
                collection[id].render();
            }
            listElem.querySelector(".groups").appendChild(collection[id].elem);
        }

        $(document).on('click', '.all-channel-controls .dropdown-menu', function (e) {
            e.stopPropagation();
        });

        this.elem = listElem;

        this.elem.querySelector('#expand-all-channels').addEventListener('click', this.expandAllChannels);

        this.elem.querySelector('#collapse-all-channels').addEventListener('click', this.collapseAllChannels);

        this.elem.querySelector('#show-all-channels').addEventListener('click', this.showAllChannels);

        this.elem.querySelector('#toggle-channel-names').addEventListener('click', this.toggleChannelNames);

        this.elem.querySelector('#hide-all-channels').addEventListener('click', this.hideAllChannels);

        this.elem.querySelector('#reset-all-channels').addEventListener('click', this.resetAllChannels);

        this.elem.querySelector('#save-all-channels').addEventListener('click', this.saveAllChannels);

        this.elem.querySelector("#dismiss-channel-panel").addEventListener('click', this.onClickedMenuHandler);

    }
}
