function ZPlaneList(parent) {

    var _self = this;

    // the images that we're showing
    this.collection = [];

    // toolbar controller
    this.parent = parent || null;

    /**
     * whether there is previous page
     * @type {boolean}
     */
    this.hasPrevious = false;

    /**
     * whether there is previous page
     * @type {boolean}
     */
    this.hasNext = false;

    /**
     * page size
     * @type {integer}
     */
    this.pageSize = null;

    /**
     * total number of zplanes
     * @type {integer}
     */
    this.totalCount = null;

    /**
     * the zIndex of main image
     * @type {integer}
     */
    this.mainImageZIndex = null;


    /**
     * whether the list is loading or not
     * @type {boolean}
     */
    this._isLoading = true;

    this._carouselStyle = {
        padding: 4,
        margin: 4
    };

    this._thumbnailProperties = {
        height: 92, // this is fixed
        width: 72, // this will change based on the aspect ratio
        maxWidth: 150 // this is fixed (TODO should be changed based on what makes more sense.)
    };

    /**
     * this variable is used to delay the resizeSenor function call.
     * @type {function}
     */
    this.delayedResizeSensorFunc;

    /**
     * the delay after which the page size should be calculated again
     * @type {integer}
     */
    this._resizeSensorDelay = 200;

    // varibale to access the UI component of the z plane.
    this._zPlaneContainer;

    // to check if the data (new z indexes fetched) needs to be appended or not
    this.appendData = false;

    /**
     * it store the current request ID for the _fetchList function and makes sure that only the most recent response is used to update the data
     * @type {integer}
     */
    this._currentRequestID;

    /**
     * it stores the current z plane fetch request that is being processed, and the data that was sent to process it.
     * @type {object}
     */
    this.currentZPlaneRequest = {
        type: 'none',
        data: {}
    };

    /**
     * it store the valid fetch requests for fetching z plane list
     * @type {Array}
     */
    this.validFetchRequests = ['fetchZPlaneListByZIndex', 'fetchZPlaneList'];

    /**
     * called on load to calculate the page size and then ask chaise to fetch the results
     * @param {object} data
     */
    this.init = function (data) {
        // console.log('init with ', data);

        // change the width to be based on the image
        if (data.mainImageWidth > 0 & data.mainImageHeight > 0) {
            _self._thumbnailProperties.width = Math.ceil(_self._thumbnailProperties.height * (data.mainImageWidth / data.mainImageHeight));
        }

        _self._currentRequestID = -1;

        // reduce the height of the main container
        var mainContainer = document.getElementById('container');
        mainContainer.classList.add('adjust-to-z-index');

        // add resize sensor
        var resizeSensorContainer = document.getElementById('z-plane-resize-sensor');
        resizeSensorContainer.innerHTML = '<div class="z-planes-container" id="z-planes-container"></div>';
        _self._zPlaneContainer = document.getElementById('z-planes-container');
        new ResizeSensor(resizeSensorContainer, function () {
            console.log('resize function: ', resizeSensorContainer.clientWidth);
            clearTimeout(_self.delayedResizeSensorFunc);
            _self.delayedResizeSensorFunc = setTimeout(function () {
                _self._calculatePageSize(resizeSensorContainer.clientWidth - 70);
            }, _self._resizeSensorDelay);
        });

        _self.totalCount = data.totalCount;
        _self.mainImageZIndex = data.mainImageZIndex;
        _self._render();
        _self._fetchListByZIndex('default');
    }

    /**
     * after request is done in chaise, this will be called to show the result
     * @param {object} data
     */
    this.updateList = function (data) {
        // in case of an old response -> return
        if (data.requestID != _self._currentRequestID) 
            return;

        console.log("updating the z-plane-list with the following data:", data, data.images.length);

        if (_self.appendData == false) {
            this.collection = data.images;
            this.hasPrevious = data.hasPrevious;
            _self.hasNext = data.hasNext;
        } else {
            _self.appendData = false;
            _self.collection = _self.collection.concat(data.images);
            if (_self.collection.length > _self.pageSize) {
                _self.collection = _self.collection.splice(0, _self.pageSize);
                _self.hasNext = true;
            } else {
                _self.hasNext = data.hasNext;
            }
        }

        if (data.updateMainImage && data.mainImageZIndex >= 0) {
            _self._onclickImageHandler(data.mainImageZIndex);
        }

        _self._updateCurrentZPlaneRequestAndFetchData('none', {});

        _self._showSpinner(false);
        _self._render();
    };

    /**
     * change the state of spinner
     * @param {boolean} display
     */
    this._showSpinner = function (display) {

        var loader = _self._zPlaneContainer.querySelector('#z-plane-loader');
        if (loader != null) {
            var carousel = _self._zPlaneContainer.querySelector('.z-plane-carousel');
            var zIndexInput = _self._zPlaneContainer.querySelector('#main-image-z-index');
            var zIndexSubmit = _self._zPlaneContainer.querySelector('#z-index-jump-button');
            if (display == true) {
                carousel.style.pointerEvents = 'none';
                loader.style.display = 'flex';
                zIndexInput.disabled = true;
                zIndexSubmit.disabled = true;
            } else {
                carousel.style.pointerEvents = 'initial';
                loader.style.display = 'none';
                zIndexInput.disabled = false;
                zIndexSubmit.disabled = false;
            }
        }
    };

    /**
     * change the currentZPlaneRequest variable and fetch the data
     * @param {string} requestType - must be present in validFetchRequests variable
     * @param {object} requestData - the content of the fetch request. Make sure the requestData is valid, no such check is done in this function
     */
    this._updateCurrentZPlaneRequestAndFetchData = function (requestType, requestData) {
        _self.currentZPlaneRequest = {
            type: requestType,
            data: requestData,
        };

        if (_self.validFetchRequests.includes(requestType)) {
            _self.parent.dispatchEvent(requestType, requestData);
            _self._showSpinner(true);
        }
        // console.log('_self.currentZPlaneRequest', _self.currentZPlaneRequest);
    }

    /**
     * calculate the page size if needed and ask chaise to fetch the new list
     */
    this._fetchList = function (data) {

        var requestData = {
            pageSize: _self.pageSize,
            before: data.before,
            after: data.after,
            requestID: ++_self._currentRequestID
        };

        _self._updateCurrentZPlaneRequestAndFetchData('fetchZPlaneList', requestData);
    };

    /**
     * calculate the page size if needed and ask chaise to fetch the new list by zIndex
     * @param {string} zIndex
     */
    this._fetchListByZIndex = function (zIndex) {
        // removing leading zeros
        zIndex = zIndex.replace(/^0+/, '');

        if (zIndex == 'default') {
            // This is case during the init function

            var requestData = {
                pageSize: _self.pageSize,
                zIndex: _self.mainImageZIndex,
                requestID: ++_self._currentRequestID
            };

            _self._updateCurrentZPlaneRequestAndFetchData('fetchZPlaneListByZIndex', requestData);
        } else if (String(parseInt(zIndex)) != zIndex) {
            // TODO show alert
            window.OSDViewer.alertService.showAlert('Invalid Input');
        } else if (parseInt(zIndex) == _self.mainImageZIndex) {
            // Do Nothing
        } else {

            var requestData = {
                pageSize: _self.pageSize,
                zIndex: zIndex,
                requestID: ++_self._currentRequestID
            };

            _self._updateCurrentZPlaneRequestAndFetchData('fetchZPlaneListByZIndex', requestData);
        }
    };

    /**
     * used internally, called by fetchList and resizeSensor
     * @param {interger} width
     */
    this._calculatePageSize = function (width) {

        width = width ? width : _self._zPlaneContainer.offsetWidth - 70;
        var totalWidthOfSingleIndex = _self._thumbnailProperties.width + 2 * (_self._carouselStyle.padding + _self._carouselStyle.margin + 2);
        var pageSize = Math.floor(parseFloat(width)/totalWidthOfSingleIndex);

        // in case the new page size is equal to the current page size, return
        if (_self.pageSize != null && pageSize == _self.pageSize) {
            return;
        }

        if (_self.currentZPlaneRequest.type != 'none') {
            // There is a request that is currently being processed, and the page size is changed, so a new request needs to be sent out with the updated page size

            var requestData = _self.currentZPlaneRequest.data;
            requestData.requestID = ++_self._currentRequestID;
            requestData.pageSize = pageSize;
            _self.pageSize = pageSize;
            _self._updateCurrentZPlaneRequestAndFetchData(_self.currentZPlaneRequest.type, requestData);

        } else {
            if (_self.pageSize == null || pageSize < _self.pageSize) {
                if (pageSize < _self.collection.length) {
                    _self.hasNext = true;
                }
                _self.pageSize = pageSize;
                _self.collection = _self.collection.splice(0, pageSize);
                _self._renderZPlaneCarousel();
            } else if (pageSize > _self.pageSize) {
                _self.pageSize = pageSize;
                _self.appendData = true;
                _self._onNextPreviousHandler(true);
            }
        }
    };

    /**
     * Given an index, will return the appropriate thumbnail image
     * TODO should be moved to somewhere more appropriate
     */
    this._getThumbnailURL = function (index) {
        if (index >= _self.collection.length) {
            return "./images/placeholder.png";
        }

        var firstURL = _self.collection[index].info[0].url;

        var width = _self._thumbnailProperties.width,
            height = _self._thumbnailProperties.height;

        // if iiif, use the api to get it
        // NOTE this is hacky and should be documented as an assumption
        // we're assuming that we can use the same iiif server as info.json location
        // and we're ignoring the @id attribute inside the info.json
        if (firstURL.indexOf("info.json") !== -1) {
            return firstURL.replace("/info.json", "") + "/full/" + width + "," + height + "/0/default.jpg";
        }

        // use the default
        return "./images/placeholder.png";
    }

    /**
     * click handler for when an image is selected
     * @param {interger} index
     */
    this._onclickImageHandler = function (index) {

        if (index < _self.collection.length && _self.collection[index].zIndex != _self.mainImageZIndex) {
            _self.mainImageZIndex = _self.collection[index].zIndex;
            _self._renderZPlaneInfo();
            _self._renderActiveZPlane();

            _self.parent.dispatchEvent('updateMainImage', _self.collection[index]);
        }
    };

    /**
     * click handler for previous and next buttons
     * @param {boolean} isNext
     */
    this._onNextPreviousHandler = function (isNext) {
        var data = {};
        if (isNext) {
            data.after = _self.collection[_self.collection.length-1].zIndex;
        } else {
            data.before = _self.collection[0].zIndex;
        }
        _self._fetchList(data);
    };

    /**
     * render the z plane carousel
     */
    this._renderZPlaneCarousel = function () {
        var zPlaneContainer = document.getElementById('z-plane-container');
        if (zPlaneContainer != null) {

            // when the number of indexes is less than the page size, they should be left aligned to the left.
            if (_self.pageSize > _self.collection.length) {
                zPlaneContainer.style.justifyContent = 'left';
            } else {
                zPlaneContainer.style.justifyContent = 'center';
            }

            var carousel = '',
                imgStyles = [
                    "width:" + _self._thumbnailProperties.width + "px",
                    "height:" + _self._thumbnailProperties.height + "px",
                    "max-width:" + _self._thumbnailProperties.maxWidth + "px"
                ]

            for (var i = 0; i < Math.min(_self.pageSize, _self.collection.length); i++) {
                carousel += '' +
                    '<div class="z-plane" data-collection-index="' + i + '" data-z-index="' + _self.collection[i].zIndex + '">' +
                        '<img src="' + _self._getThumbnailURL(i) + '" style="' + imgStyles.join(";") + '" class="z-plane-image">' +
                        '<div class="z-plane-id">' +
                            (_self.collection[i].zIndex).toString() +
                        '</div>' +
                    '</div>';
            }

            zPlaneContainer.innerHTML = carousel;
            zPlaneContainer.querySelectorAll(".z-plane").forEach(function (elem) {
                elem.addEventListener('click', function () {
                    _self._onclickImageHandler(parseInt(elem.dataset.collectionIndex));
                });
            }.bind(this))
            _self._renderActiveZPlane();
            _self._renderNextPreviousButtons();
        }
    }

    /**
     * render the z plane infrmation, i.e. the current selected index and total available indexes
     */
    this._renderZPlaneInfo = function () {
        var zPlaneInfo = document.getElementById('z-plane-info-container');
        zPlaneInfo.innerHTML = 'Z index: <input id="main-image-z-index" onkeypress="return (event.charCode == 8 || event.charCode == 0 || event.charCode == 13) ? null : event.charCode >= 48 && event.charCode <= 57" class="main-image-z-index" value="' + _self.mainImageZIndex + '" placeholder="' + _self.mainImageZIndex + '">'+
            '<button id="z-index-jump-button" class="jump-to-buttom-container" title="Jump to specific Z index">'+
                '<i class="fa fa-share jump-to-button"></i>'+
            '</button>'+
            '<span>(total of ' + _self.totalCount + ' generated)</span>';

        var jumpButtom = zPlaneInfo.querySelector('.jump-to-buttom-container');
        jumpButtom.addEventListener('click', function () {
            // add check to make sure that it is int
            var newIndex = zPlaneInfo.querySelector('#main-image-z-index').value;
            _self._fetchListByZIndex(newIndex);
        });

        var inputBox = zPlaneInfo.querySelector('#main-image-z-index');
        inputBox.addEventListener('keydown', event => {
            if (event.keyCode == 13) {
                var newIndex = zPlaneInfo.querySelector('#main-image-z-index').value;
                _self._fetchListByZIndex(newIndex);
            }
        });

    }

    /**
     * render the previous and next buttons, attach the onclick event, set active or disabled view mode
     */
    this._renderNextPreviousButtons = function() {

        var previousButton = _self._zPlaneContainer.querySelector('#previous-button');
        previousButton.classList.remove('disabled', 'active-button');
        if (_self.hasPrevious) {
            previousButton.disabled = false;
            previousButton.classList.add('active-button');
        } else {
            previousButton.disabled = true;
            previousButton.classList.add('disabled');
        }


        var nextButton = _self._zPlaneContainer.querySelector('#next-button');
        nextButton.classList.remove('disabled', 'active-button');
        if (_self.hasNext) {
            nextButton.disabled = false;
            nextButton.classList.add('active-button');
        } else {
            nextButton.disabled = true;
            nextButton.classList.add('disabled');
        }
    };

    /**
     * renders the index which is active, i.e. mainImageZIndex
     */
    this._renderActiveZPlane = function() {
        _self._zPlaneContainer.querySelectorAll('.z-plane').forEach(function (elem) {
            if (elem.dataset.zIndex == _self.mainImageZIndex) {
                elem.classList.add('active');
            } else if (elem.classList.contains('active')) {
                elem.classList.remove('active');
            }
        }.bind(this));
    }

    /**
     * render the element
     */
    this._render = function () {

        // TODO (later) based on the type of images we show the thumbnails or not

        var zPlaneInfo = '' +
            '<div class="z-plane-info-container" id="z-plane-info-container">' +
            '</div>';

        var zPlaneCarousel = '' +
            '<div class="z-plane-carousel">' +
                '<div id="z-plane-loader" class="z-plane-loader">' +
                    '<div class="loader-container">' +
                        '<img class="loader-image" src="./images/loader.gif">' +
                        '<div class="loader-text">Loading...</div>' +
                    '</div>' +
                '</div >' +
                '<button class="button-container" id="previous-button">' +
                    '<i class="fa fa-angle-left" style="width:100%"></i>' +
                '</button>' +
                '<div class="z-plane-container" id="z-plane-container">' +
                '</div>' +
                '<button class="button-container" id="next-button">' +
                    '<i class="fa fa-angle-right" style="width:100%"></i>' +
                '</button>' +
            '<div>';

        _self._zPlaneContainer.innerHTML = zPlaneInfo + zPlaneCarousel;

        // _onNextPreviousHandler
        var prevButton = _self._zPlaneContainer.querySelector('#previous-button');
        prevButton.addEventListener('click', function () {
            _self._onNextPreviousHandler(false);
        });

        var nextButton = _self._zPlaneContainer.querySelector('#next-button');
        nextButton.addEventListener('click', function () {
            _self._onNextPreviousHandler(true);
        });

        _self._renderZPlaneInfo();
        _self._calculatePageSize();
        _self._renderZPlaneCarousel();
    };

}