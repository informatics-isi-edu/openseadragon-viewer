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

    this._zIndexInputDelay = 2000;

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
     * it store the default z index for the image
     * @type {integer}
     */
    this.defaultZIndex = -1;

    /**
     * it stores the of the container. It is used to make the UI containing the z plane info and slider responsive.
     * @type {integer}
     */
    this.previousContainerWidth = 0;

    /**
     * it is constant which tells after what width should the UI for z plane info split into 2 lines
     * @type {integer}
     */
    this._minWidth = 800;

    /**
     * it stores the min and max of the slider, i.e. min and max z index in the DB
     * @type {object}
     */
    this.sliderRange = {};

    /**
     * called on load to calculate the page size and then ask chaise to fetch the results
     * @param {object} data
     */
    this.init = function (data) {

        // change the width to be based on the image
        if (data.mainImageWidth > 0 & data.mainImageHeight > 0) {
            _self._thumbnailProperties.width = Math.ceil(_self._thumbnailProperties.height * (data.mainImageWidth / data.mainImageHeight));
        }

        _self._currentRequestID = -1;

        // reduce the height of the main container
        var mainContainer = document.getElementById('container');
        mainContainer.style.height = _self.getContaierHeight(mainContainer.offsetWidth);

        // add resize sensor
        var resizeSensorContainer = document.getElementById('z-plane-resize-sensor');
        resizeSensorContainer.innerHTML = '<div class="z-planes-container" id="z-planes-container"></div>';
        _self.previousContainerWidth = resizeSensorContainer.clientWidth;
        _self._zPlaneContainer = document.getElementById('z-planes-container');
        new ResizeSensor(resizeSensorContainer, function () {
            clearTimeout(_self.delayedResizeSensorFunc);
            _self.delayedResizeSensorFunc = setTimeout(function () {
                _self._calculatePageSize(resizeSensorContainer.clientWidth - 70);

                // change the height of the main contaienr
                if (_self.previousContainerWidth < _self._minWidth && resizeSensorContainer.clientWidth >= _self._minWidth || _self.previousContainerWidth >= _self._minWidth && resizeSensorContainer.clientWidth < _self._minWidth) {
                    _self.changeContainerHeight(resizeSensorContainer.clientWidth);
                }
                _self.previousContainerWidth = resizeSensorContainer.clientWidth;
            }, _self._resizeSensorDelay);
        });

        _self.totalCount = data.totalCount;
        _self.mainImageZIndex = data.mainImageZIndex;
        _self.defaultZIndex = data.mainImageZIndex;
        _self.canUpdateDefaultZIndex = data.canUpdateDefaultZIndex;
        _self.sliderRange = {
            'min': data.minZIndex,
            'max': data.maxZIndex
        };

        _self._render();
        _self._fetchListByZIndex('default');
    }

    /**
     * This function returns the new height of the container based on its width
     * @param {integer} width
     */
    this.getContaierHeight = function(width) {
        if (width < _self._minWidth) {
            // reduce the height of the main container
            return 'calc(100% - 170px)';
        } else {
            // increase the height of the main container
            return 'calc(100% - 145px)';
        }
    }

    /**
     * This function changes the height of the main container
     * @param {integer} width
     */
    this.changeContainerHeight = function(width) {
        var mainContainer = document.getElementById('container');
        mainContainer.style.height = _self.getContaierHeight(width);
    }

    /**
     * @param {object} data
     * Properties of data
     * requestID: the id of the request to which the data is the response of
     * images: the array of images thaat need to be shown in the z plane list
     * hasPrevious: boolean value, which determines if there is/are z planes with index less than the first z plane present in the 'images' array
     * hasNext: boolean value, which determines if there is/are z planes with index more than the last z plane present in the 'images' array
     * updateMainImage: boolean value, which determines whether the main image needs to be updated or not
     * mainImageIndex: if 'updateMainImage' is true, the this gives the index to which the main images needs to be changed to.
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
            // if appendData is true, this means that the new images that were fetched need to be added to the existing set of images.
            _self.appendData = false;
            _self.collection = _self.collection.concat(data.images);
            if (_self.collection.length > _self.pageSize) {
                // if after appending the images the collection length is bigger than the page size, remove the unecessary images. Since iamges were removed, this means that there are more images and therefore 'hasNext' is set to true
                _self.collection = _self.collection.splice(0, _self.pageSize);
                _self.hasNext = true;
            } else {
                _self.hasNext = data.hasNext;
            }
        }

        // the used z-index is different from the input, so we should show an error message
        if (data.updateMainImage) {
            var usedZIndex = data.images[data.mainImageIndex].zIndex;
            if (data.inputZIndex != usedZIndex) {
                var message = "Could not find any image with Z index of <code>" + data.inputZIndex + "</code>.";
                message += "Displaying the closest generated Z index of <code>" + usedZIndex + "</code> instead.";
                window.OSDViewer.errorService.showPopupError(
                    "Z Index Not Found",
                    message,
                    true
                );
            }
        }

        if (data.updateMainImage && data.mainImageIndex >= 0) {
            _self._onclickImageHandler(data.mainImageIndex);
        }

        // emptying currentZPlaneRequest so that to indicate that no z plane fetch request is pending
        _self._updateCurrentZPlaneRequestAndFetchData('none', {});

        _self._render();
    };

    /**
     * This function updates the value of local default z index, with the value that is recieves, and then updates the 'Update default z' button
     * @param {object} data
     */
    this.updatedDefaultZIndex = function (data) {

        if ('zIndex' in data) {
            _self.defaultZIndex = data['zIndex'];
            document.querySelector('#current-default-z-index').innerHTML = _self.defaultZIndex;
            _self._renderUpdateDefaultZButton();
        }
    };

    /**
     * This function renders the update default z button
     */
    this._renderUpdateDefaultZButton = function () {
        var updateDeaultZButton = _self._zPlaneContainer.querySelector("#save-default-z-index");
        if (updateDeaultZButton) {
            updateDeaultZButton.innerHTML = '<i class="glyphicon glyphicon-saved update-default-z-button"></i>';
            if (_self.defaultZIndex == _self.mainImageZIndex) {
                updateDeaultZButton.disabled = true;
            } else {
                updateDeaultZButton.disabled = false;
            }
        }
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
            var updateDeaultZButton = _self._zPlaneContainer.querySelector("#save-default-z-index");
            updateDeaultZButton = updateDeaultZButton ? updateDeaultZButton : {};
            if (display == true) {
                carousel.style.pointerEvents = 'none';
                loader.style.display = 'flex';
                zIndexInput.disabled = true;
                zIndexSubmit.disabled = true;
                updateDeaultZButton.disabled = true;
                _self._disableSlider(true);
            } else {
                carousel.style.pointerEvents = 'initial';
                loader.style.display = 'none';
                zIndexInput.disabled = false;
                zIndexSubmit.disabled = false;
                updateDeaultZButton.disabled = false;
                _self._disableSlider(false);
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

        if (_self.validFetchRequests.indexOf(requestType) != -1) {
            _self.parent.dispatchEvent(requestType, requestData);
            _self._showSpinner(true);
        } else if (requestData == 'none') {
            _self._showSpinner(false);
        }
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
     * calculate the page size if needed and ask chaise to fetch the new list by zIndex, make sure that zIndex is a valid integer. No such check is being done in this function
     * @param {string} zIndex
     */
    this._fetchListByZIndex = function (zIndex) {
        if (zIndex == 'default') {
            // This is case during the init function

            var requestData = {
                pageSize: _self.pageSize,
                zIndex: _self.mainImageZIndex,
                requestID: ++_self._currentRequestID
            };

            _self._updateCurrentZPlaneRequestAndFetchData('fetchZPlaneListByZIndex', requestData);

            return;
        }

        // turn the value into integer (takes care of leading zeros as well)
        zIndex = parseInt(zIndex);

        // make sure we're not sending invalid inputs to chaise
        // NOTE this technically shouldn't happen and the calling site should take care of this
        if (isNaN(zIndex)) {
            return;
        }

        if (zIndex != _self.mainImageZIndex) {
            // since some requests might be stale and therefore not displayed,
            // this has to be here and cannot be in chaise
            // if we do this in chaise, it might show multiple errors
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

        } else if (_self.pageSize == null || pageSize < _self.pageSize) {
            // there is no current request pending, and the new page size is less than the current page size, so no new request is needed and we only need to truncate the exsisting data

            if (pageSize < _self.collection.length) {
                _self.hasNext = true;
            }
            _self.pageSize = pageSize;
            _self.collection = _self.collection.splice(0, pageSize);
            _self._renderZPlaneCarousel();
        } else if (pageSize > _self.pageSize) {
            // // there is no current request pending, and the new page size is greater than the current page size, so a new request needs to be sent to fetch new data

            _self.pageSize = pageSize;
            _self.appendData = true;
            _self._onNextPreviousHandler(true);
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
     * This function sends a request to chaise to update the default z index, and shows a spinner in place of the save icon
     */
    this._saveDefaultZIndexHandler = function () {
        _self.parent.dispatchEvent('updateDefaultZIndex', {zIndex: _self.mainImageZIndex});
        var saveDefaultZ = _self._zPlaneContainer.querySelector("#save-default-z-index");
        if (saveDefaultZ) {
            saveDefaultZ.innerHTML = '<i class="glyphicon glyphicon-refresh glyphicon-refresh-animate update-default-z-button" ></i>';
            saveDefaultZ.disabled = true;
        }
    };

    /**
     * click handler for when an image is selected
     * @param {interger} index
     */
    this._onclickImageHandler = function (index) {

        if (index < _self.collection.length && _self.collection[index].zIndex != _self.mainImageZIndex) {
            _self.mainImageZIndex = _self.collection[index].zIndex;
            _self._renderUpdateDefaultZButton();
            _self._renderZPlaneInfo();
            _self._renderActiveZPlane();
            _self._renderZPlaneSlider();

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

        var jumpButtom = '<button id="z-index-jump-button" class="info-buttom-container" data-tippy-placement="top" data-tippy-content="Jump to the given Z index">' +
                            '<i class="glyphicon glyphicon-share-alt jump-to-button"></i>' +
                        '</button>';
        var updateButton = '';

        if (_self.canUpdateDefaultZIndex == true) {
            // add the update button if the default z index can be updated (derived from acl)
            updateButton = '<button id="save-default-z-index" class="info-buttom-container" data-tippy-placement="top" data-tippy-content="Update the default Z index">' +
                                '<i class="fas fa-save update-default-z-button"></i>' +
                            '</button>';
        }

        zPlaneInfo.innerHTML = '' + 
            'Z index: <input id="main-image-z-index" onkeypress="return (event.charCode == 8 || event.charCode == 0 || event.charCode == 13) ? null : event.charCode >= 48 && event.charCode <= 57" class="main-image-z-index" value="' + _self.mainImageZIndex + '" placeholder="' + _self.mainImageZIndex + '">' +
            '<span>' +
                jumpButtom +
                updateButton +
            '</span>' +
            '<span>(' + _self.totalCount + ' generated, default Z <span id="current-default-z-index">' + _self.defaultZIndex + '</span>)</span>';

        // console.log(zPlaneInfo);

        _self._renderUpdateDefaultZButton();

        var inputChangedPromise = null;
        var inputEl = zPlaneInfo.querySelector('#main-image-z-index');

        var grabInputAndSearch = function (event) {
            clearTimeout(inputChangedPromise);
            var newIndex = inputEl.value;
            if (isNaN(parseInt(newIndex))) {
                inputEl.value = _self.mainImageZIndex;
                return;
            }
            _self._fetchListByZIndex(newIndex);
        }

        var jumpButtom = zPlaneInfo.querySelector('#z-index-jump-button');
        jumpButtom.addEventListener('click', grabInputAndSearch);

        var inputBox = zPlaneInfo.querySelector('#main-image-z-index');
        inputBox.addEventListener('change', grabInputAndSearch);

        inputBox.addEventListener('input', function (event) {
            clearTimeout(inputChangedPromise);
            inputChangedPromise = setTimeout(function () {
                grabInputAndSearch(event);
            }, _self._zIndexInputDelay);
        });

        var saveDefaultZ = zPlaneInfo.querySelector("#save-default-z-index");
        if (saveDefaultZ) {
            saveDefaultZ.addEventListener('click', _self._saveDefaultZIndexHandler);
        }

        tippy('#z-plane-info-container [data-tippy-content]', {theme: "light"});

    }

    /**
     * This function controls whether to show/hide the tooltip for the slider, where to show the tooltip and what value to show in the tooltip
     * @param {boolean} show
     * @param {object} tooltip
     * @param {integer} sliderValue
     */
    this.showHideZPlaneSliderTooltip = function (show, tooltip, sliderValue) {
        if (show && tooltip) {
            if (tooltip) {
                tooltip.style.display = 'block';
                tooltip.innerHTML = sliderValue;
    
                var delta = (sliderValue - _self.sliderRange.min) / (_self.sliderRange.max - _self.sliderRange.min);
                var thumbRadius = 5;
                tooltip.style.left = ((thumbRadius * 2) + ((270 - (thumbRadius * 2)) * delta) - (tooltip.offsetWidth / 2)) + 'px';
                // console.log(tooltip.style.left, tooltip.offsetWidth);
            }
        } else if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    /**
     * This function render the slider
     */
    this._renderZPlaneSlider = function () {
        var zPlaneSlider = document.getElementById('z-plane-slider');
        var slider = '' +
                '<button class="circular-button" id="slider-previous-button"><i class="glyphicon glyphicon-triangle-left left"></i></button>' +
                '<div class="min-max">'+_self.sliderRange.min+'</div>' + 
                '<div class="slider-tooltip-container">' +
                    '<input class="slider" type="range" id="z-index-slider" value="' + _self.mainImageZIndex + '" min="' + _self.sliderRange.min + '" max="' + _self.sliderRange.max + '">'+
                    '<div class="slider-tooltip" id="slider-tooltip">1</div>' +
                '</div>' +
                '<div class="min-max">'+_self.sliderRange.max+'</div>' +
                '<button class="circular-button" id="slider-next-button"><i class="glyphicon glyphicon-triangle-right right"></i></button>' ;
        zPlaneSlider.innerHTML = slider;
        
        var slider = zPlaneSlider.querySelector('#z-index-slider');
        if (slider) {
            slider.addEventListener('change', function (event) {
                _self._fetchListByZIndex(slider.value);
            });

            slider.addEventListener('input', function() {
                // show tooltip
                var tooltip = zPlaneSlider.querySelector('#slider-tooltip');
                _self.showHideZPlaneSliderTooltip(true, tooltip, slider.value);
            });

            slider.addEventListener('mouseup', function () {
                // hide tooltip
                var tooltip = zPlaneSlider.querySelector('#slider-tooltip');
                _self.showHideZPlaneSliderTooltip(false, tooltip);
            })
        }

        var prevButton = zPlaneSlider.querySelector('#slider-previous-button');
        prevButton.addEventListener('click', function() {
            _self.changeImageToPreviousNext(true);
        });
        // disable the prev button if the main image is the min z index available in the DB
        if (_self.mainImageZIndex == _self.sliderRange.min) {
            prevButton.disabled = true;
        }

        var nextButton = zPlaneSlider.querySelector('#slider-next-button');
        nextButton.addEventListener('click', function () {
            _self.changeImageToPreviousNext(false);
        });
        // disable the next button if the main image is the max z index available in the DB
        if (_self.mainImageZIndex == _self.sliderRange.max) {
            nextButton.disabled = true;
        }
    };

    /**
     * This function is used to disable the slider when loading
     */
    this._disableSlider = function (disable) {
        var zPlaneSlider = document.getElementById('z-plane-slider');
        if (zPlaneSlider) {
            var prevButton = zPlaneSlider.querySelector('#slider-previous-button');
            var nextButton = zPlaneSlider.querySelector('#slider-next-button');
            var slider = zPlaneSlider.querySelector('#z-index-slider');
            if (disable) {
                prevButton.disabled = true;
                nextButton.disabled = true;
                slider.disabled = true;
            } else {
                prevButton.disabled = false;
                nextButton.disabled = false;
                slider.disabled = false;
            }
        }
    }

    this.changeImageToPreviousNext = function(previous) {

        var mainImageCollectionIndex = -1;
        for (let i = 0; i < _self.collection.length; i++) {
            if (_self.collection[i]['zIndex'] == _self.mainImageZIndex) {
                mainImageCollectionIndex = i;
                break;
            }
        }

        if (mainImageCollectionIndex != -1) {
            if (previous) {
                if (mainImageCollectionIndex > 0) {
                    _self._onclickImageHandler(mainImageCollectionIndex - 1);
                } else {
                    _self._fetchListByZIndex(Math.max(_self.sliderRange.min, _self.mainImageZIndex - 1));
                }
            } else {
                if (mainImageCollectionIndex < _self.collection.length - 1) {
                    _self._onclickImageHandler(mainImageCollectionIndex + 1);
                } else {
                    _self._fetchListByZIndex(Math.min(_self.sliderRange.max, _self.mainImageZIndex + 1));
                }
            }
        } else {
            if (previous) {
                _self._fetchListByZIndex(Math.max(_self.sliderRange.min, _self.mainImageZIndex - 1));
            } else {
                _self._fetchListByZIndex(Math.min(_self.sliderRange.max, _self.mainImageZIndex + 1));
            }
        }
    };

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

        var zPlaneSlider = '' +
            '<div class="z-plane-slider" id="z-plane-slider">' +
            '</div>';

        var infoSliderContainer = '' +
            '<div class="info-slider-container" id="info-slider-container">' +
                zPlaneInfo + 
                zPlaneSlider +
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

        _self._zPlaneContainer.innerHTML = infoSliderContainer + zPlaneCarousel;

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
        _self._renderZPlaneSlider();
        _self._calculatePageSize();
        _self._renderZPlaneCarousel();

        tippy('#z-plane-resize-sensor [data-tippy-content]', {theme: "light"});
    };

}
