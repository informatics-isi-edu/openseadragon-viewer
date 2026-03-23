function ChannelList(parent) {

    var _self = this;

    this.elem = null;
    this.collection = {};
    this.parent = parent || null;
    this.showChannelNamesOverlay = false;

    /**
     * The current search term used to filter the channel list.
     * Empty string means no filter is active.
     * @type {string}
     */
    this._searchTerm = '';

    /**
     * Check whether a channel is excluded by the current search filter.
     * @param {string} id - The osdItemId of the channel to check.
     * @returns {boolean} True if the channel does not match the search term and should be skipped.
     */
    this._isFilteredOut = function(id) {
        if (!_self._searchTerm) return false;
        return _self.collection[id].name.toLowerCase().indexOf(_self._searchTerm) === -1;
    };

    /**
     * Update the tooltips on bulk action buttons to reflect
     * whether a search filter is active (e.g. "all channels" vs "all matching channels").
     * Also used during initial render to create the tippy instances.
     */
    this._updateBulkTooltips = function() {
        var noun = _self._searchTerm ? 'matching channels' : 'channels';
        var tooltips = {
            '#save-all-channels': 'Save the current settings for all ' + noun,
            '#reset-all-channels': 'Reset settings of all ' + noun,
            '#collapse-all-channels': 'Collapse all ' + noun + ' controls',
            '#expand-all-channels': 'Expand all ' + noun + ' controls',
            '#hide-all-channels': 'Hide all ' + noun,
            '#show-all-channels': 'Display all ' + noun,
        };
        for (var sel in tooltips) {
            var el = _self.elem.querySelector(sel);
            if (!el) continue;
            if (el._tippy) {
                el._tippy.setContent(tooltips[sel]);
            } else {
                tippy(el, { content: tooltips[sel] });
            }
        }
    };

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

    this.replaceList = function(data) {
        this.collection = {};
        this.elem = null;
        this.add(data.channelList);
        this.showChannelNamesOverlay = data.showChannelNamesOverlay;

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
            if (_self._isFilteredOut(id)) continue;
            _self.collection[id].onClickToggleExpand(event, true);
        }
    };

    this.collapseAllChannels = function (event) {
        for (var id in _self.collection) {
            if (_self._isFilteredOut(id)) continue;
            _self.collection[id].onClickToggleExpand(event, false);
        }
    };

    this.showAllChannels = function (event) {
        for (var id in _self.collection) {
            if (_self._isFilteredOut(id)) continue;
            _self.collection[id].onClickToggleDisplay(event, true);
        }
        _self.updateChannelSummary();
    };

    this.hideAllChannels = function (event) {
        for (var id in _self.collection) {
            if (_self._isFilteredOut(id)) continue;
            _self.collection[id].onClickToggleDisplay(event, false);
        }
        _self.updateChannelSummary();
    };

    this.resetAllChannels = function (event) {
        for (var id in _self.collection) {
            if (_self._isFilteredOut(id)) continue;
            _self.collection[id].resetChannelSettings(event);
        }
    };

    this.saveAllChannels = function (event) {
        var data = [];

        var btn = _self.elem.querySelector("#save-all-channels");
        btn.className = "channels-control glyphicon glyphicon-refresh glyphicon-refresh-animate";

        for (var id in _self.collection) {
            if (_self._isFilteredOut(id)) continue;
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
        _self.showChannelNamesOverlay = !_self.showChannelNamesOverlay;
        _self.parent.dispatchEvent('toggleChannelNamesOverlay');

        var showChannelNamesDiv = document.getElementById('toggle-channel-names');

        if (_self.showChannelNamesOverlay) {
            showChannelNamesDiv.innerHTML = 'Hide Channel Names'
        } else {
            showChannelNamesDiv.innerHTML = 'Show Channel Names'
        }

    }

    this.filterChannels = function() {
        var searchInput = _self.elem.querySelector('#channel-search-input');
        var clearBtn = _self.elem.querySelector('#channel-search-clear');
        var groupsContainer = _self.elem.querySelector('.groups');
        var searchQuery = searchInput.value.toLowerCase().trim();
        var matchCount = 0;
        var noResultsMsg = _self.elem.querySelector('.no-results-message');

        _self._searchTerm = searchQuery;

        // Update clear button visibility
        if (searchQuery.length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }

        // Remove existing no results message if present
        if (noResultsMsg) {
            noResultsMsg.remove();
        }

        // Filter channels
        for (var id in _self.collection) {
            if (_self.collection.hasOwnProperty(id)) {
                var item = _self.collection[id];
                var itemName = item.name.toLowerCase();

                if (searchQuery === '' || itemName.indexOf(searchQuery) !== -1) {
                    item.elem.style.display = 'block';
                    matchCount++;
                } else {
                    item.elem.style.display = 'none';
                }
            }
        }

        // Show empty state if no matches
        if (matchCount === 0 && searchQuery !== '') {
            var noResultsElem = document.createElement('div');
            noResultsElem.className = 'no-results-message';
            noResultsElem.textContent = 'No matching channels found';
            groupsContainer.insertBefore(noResultsElem, groupsContainer.firstChild);
        }

        // Update summary and tooltips
        _self.updateChannelSummary();
        _self._updateBulkTooltips();
    }

    this.clearSearch = function() {
        var searchInput = _self.elem.querySelector('#channel-search-input');
        searchInput.value = '';
        _self.filterChannels();
    }

    this.updateChannelSummary = function() {
        var summaryElem = _self.elem.querySelector('#channel-summary');
        if (!summaryElem) return;

        var totalCount = 0;
        var visibleCount = 0;
        var displayedCount = 0;

        for (var id in _self.collection) {
            if (_self.collection.hasOwnProperty(id)) {
                totalCount++;
                var item = _self.collection[id];

                if (!_self._isFilteredOut(id)) {
                    visibleCount++;
                    if (item.isDisplay) {
                        displayedCount++;
                    }
                }
            }
        }

        summaryElem.textContent = 'Found ' + visibleCount + ' of ' + totalCount + ' (' + displayedCount + ' Displayed)';
    }

    this.onChannelDisplayChanged = function() {
        _self.updateChannelSummary();
    }


    // Render the view
    this.render = function() {

        const collection = this.collection;
        const listElem = document.createElement("div");
        let id;

        var channelHamburger = [
            '<span class="dropdown">',
                '<button class="channel-hamburger-button" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">',
                    '<i class="channels-control fas fa-bars"></i>',
                '</button>',
                '<ul class="dropdown-menu" aria-labelledby="dropdownMenu1">',
                    '<li>',
                        '<span class="channel-hamburger-item" id="toggle-channel-names">',
                            (this.showChannelNamesOverlay ? 'Hide' : 'Show') + ' Channel Names',
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
                    "<div class='title-header'>",
                        "<div class='title-content'>",
                            "<span data-tippy-content='Hide the channel list' class='title' id='dismiss-channel-panel'>Channels</span>",
                        "</div>",
                        "<div class='all-channel-controls'>",
                            "<span class='channels-control glyphicon glyphicon-saved' id='save-all-channels'></span>",
                            "<span class='channels-control fas fa-undo' id='reset-all-channels'></span>",
                            "<span class='channels-control fa fa-caret-up' id='collapse-all-channels'></span>",
                            "<span class='channels-control fa fa-caret-down' id='expand-all-channels'></span>",
                            "<span class='channels-control fa fa-eye-slash' id='hide-all-channels'></span>",
                            "<span class='channels-control fa fa-eye' id='show-all-channels'></span>",
                            channelHamburger.join(''),
                        "</div>",
                    "</div>",
                    "<div class='search-container input-group'>",
                        "<input type='text' id='channel-search-input' class='form-control search-input' placeholder='Search channels...' />",
                        "<i class='fas fa-times search-clear' id='channel-search-clear'></i>",
                        "<span class='input-group-addon'><i class='fas fa-search'></i></span>",
                    "</div>",
                    "<div class='channel-summary' id='channel-summary'></div>",
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

        // Initialize tooltips for bulk action buttons
        this._updateBulkTooltips();

        // Attach event listeners only if elements exist
        const expandAllBtn = this.elem.querySelector('#expand-all-channels');
        const collapseAllBtn = this.elem.querySelector('#collapse-all-channels');
        const showAllBtn = this.elem.querySelector('#show-all-channels');
        const hideAllBtn = this.elem.querySelector('#hide-all-channels');
        const resetAllBtn = this.elem.querySelector('#reset-all-channels');
        const saveAllBtn = this.elem.querySelector('#save-all-channels');
        const dismissBtn = this.elem.querySelector("#dismiss-channel-panel");
        const toggleChannelNamesBtn = this.elem.querySelector('#toggle-channel-names');
        const searchInput = this.elem.querySelector('#channel-search-input');
        const searchClear = this.elem.querySelector('#channel-search-clear');

        if (expandAllBtn) expandAllBtn.addEventListener('click', this.expandAllChannels);
        if (collapseAllBtn) collapseAllBtn.addEventListener('click', this.collapseAllChannels);
        if (showAllBtn) showAllBtn.addEventListener('click', this.showAllChannels);
        if (hideAllBtn) hideAllBtn.addEventListener('click', this.hideAllChannels);
        if (resetAllBtn) resetAllBtn.addEventListener('click', this.resetAllChannels);
        if (saveAllBtn) saveAllBtn.addEventListener('click', this.saveAllChannels);
        if (dismissBtn) dismissBtn.addEventListener('click', this.onClickedMenuHandler);
        if (toggleChannelNamesBtn) toggleChannelNamesBtn.addEventListener('click', this.toggleChannelNames);

        // Wire up search functionality
        if (searchInput && searchClear) {
            searchInput.addEventListener('input', this.filterChannels);
            searchClear.addEventListener('click', this.clearSearch);

            // Initialize summary
            this.updateChannelSummary();
        }

    }
}
