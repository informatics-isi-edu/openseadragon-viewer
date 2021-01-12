function ZPlaneList(parent) {

    var _self = this;

    // the images that we're showing
    this.collection = [];

    // the displayed element
    this.elem = null;

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
        height: 92,
        width: 72.3167
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
     * called on load to calculate the page size and then ask chaise to fetch the results
     */
    this.init = function (data) {
        console.log('init');

        // reduce the height of the main container
        var mainContainer = document.getElementById('container');
        mainContainer.classList.add('adjust-to-z-index');

        // add resize sensor
        var resizeSensorContainer = document.getElementById('resize-sensor');
        resizeSensorContainer.innerHTML = '<div class="z-planes-container" id="z-planes-container"></div>';
        _self._zPlaneContainer = document.getElementById('z-planes-container');
        new ResizeSensor(resizeSensorContainer, function () {
            clearTimeout(_self.delayedResizeSensorFunc);
            _self.delayedResizeSensorFunc = setTimeout(function () {
                _self._calculatePageSize(resizeSensorContainer.clientWidth - 70);
            }, _self._resizeSensorDelay);
        });

        _self.totalCount = data.totalCount;
        _self.mainImageZIndex = data.mainImageZIndex;
        _self._render();
        _self._fetchList({});
    }

    /**
     * after request is done in chaise, this will be called to show the result
     */
    this.updateList = function (data) {
        console.log("updating the z-plane-list with the following data:", data, data.images.length);

        if (_self.appendData == false) {
            this.collection = data.images;
            this.hasPrevious = data.hasPrevious;
        } else {
            _self.appendData = false;
            _self.collection = _self.collection.concat(data.images);
        }
        _self.hasNext = data.hasNext

        // if this the first time rendering, we should adjust the pagesize based on what we got
        // our calculations might not be correct as what's in database might be less than total count
        if (_self.elem == null) {
            _self.pageSize = data.images.length;
            _self._setContainerStyle();
        }
        _self._showSpinner(false);
        this._render();
    };

    /**
     * change the state of spinner
     */
    this._showSpinner = function (display) {
        // TOOD based on display change the class to show/hide the spinner
        var loader = _self._zPlaneContainer.querySelector('#z-plane-loader');
        if (loader != null) {
            var carousel = _self._zPlaneContainer.querySelector('.z-plane-carousel');
            if (display == true) {
                carousel.style.pointerEvents = 'none';
                loader.style.display = 'flex';

            } else {
                carousel.style.pointerEvents = 'initial';
                loader.style.display = 'none';
            }
        }
    };

    /**
     * calculate the page size if needed and ask chaise to fetch the new list
     */
    this._fetchList = function (data) {
        _self._showSpinner(true);

        if (_self.pageSize == null) {
            _self._calculatePageSize();
        }

        // TODO ask chaise to get the new images
        _self.parent.dispatchEvent('fetchZPlaneList', {
            pageSize: _self.pageSize,
            before: data.before,
            after: data.after
        });
    };

    /**
     * will be called to properly position next/prev buttons and other static styles by resizeSensor and on load
     */
    this._setContainerStyle = function () {
        // TODO calculate based on the size and everything
        this._styles = {};
    };

    /**
     * used internally, called by fetchList and resizeSensor
     */
    this._calculatePageSize = function (width) {
        // TODO based on the container size figure out the number of images that we should ask
        // console.log('width = ', width, _self._zPlaneContainer.offsetWidth - 70);
        width = width ? width : _self._zPlaneContainer.offsetWidth - 70;
        var totalWidthOfSingleIndex = _self._thumbnailProperties.width + 2 * (_self._carouselStyle.padding + _self._carouselStyle.margin + 2);
        var pageSize = Math.floor(parseFloat(width)/totalWidthOfSingleIndex);
        console.log(pageSize, _self.pageSize);
        if (_self.pageSize == null || pageSize < _self.pageSize) {
            _self.pageSize = pageSize;
            _self.collection = _self.collection.splice(0, pageSize);
            // console.log('new page size = ', pageSize);
            _self._renderZPlaneCarousel();
        } else if (pageSize > _self.pageSize) {
            // TODO call fetch list to get more indexes
            _self.pageSize = pageSize;
            _self.appendData = true;
            _self._onNextPreviousHandler(true);
            // _self._renderZPlaneCarousel();
        }

        // TODO if the number of available indexex are less than the page size then left align all the indexes, instead of center align
    };

    /**
     * click handler for when an image is selected
     * @param {interger} index 
     */
    this._onclickImageHandler = function (index) {
        // TODO highlight the image
        // _self.mainImageZIndex = _self.collection[zIndex];

        // // ask viewer to change the image
        // _self.parent.dispatchEvent('updateMainImage', {
        //     image: _self.collection[index]
        // });

        // var mainImageUI = document.getElementById('main-image-z-index');
        // mainImageUI.innerHTML = _self.mainImageZIndex;

        if (index < _self.collection.length && _self.collection[index].zIndex != _self.mainImageZIndex) {
            console.log(_self.collection[index].zIndex);
            _self.mainImageZIndex = _self.collection[index].zIndex;
            _self._renderZPlaneInfo();
            _self._renderActiveZPlane();

            _self.parent.dispatchEvent('updateMainImage', _self.collection[index]);
        }
    };

    /**
     * click handler for previous and next buttons
     */
    this._onNextPreviousHandler = function (isNext) {
        var data = {};
        if (isNext) {
            data.after = _self.collection[_self.collection.length-1].zIndex;
        } else {
            data.before = _self.collection[0].zIndex;
        }
        this._fetchList(data);
    };

    /**
     * render the z plane carousel
     */
    this._renderZPlaneCarousel = function () {
        var zPlaneContainer = document.getElementById('z-plane-container');
        if (zPlaneContainer != null) {

            // when the number of indexes is less than the page size, they should be left aligned to the left.
            // TODO add check for last page too for left align
            if (_self.pageSize > _self.collection.length) {
                zPlaneContainer.style.justifyContent = 'left';
            } else {
                zPlaneContainer.style.justifyContent = 'center';
            }

            var carousel = '';

            // TODO update the src of the thumbnail
            for (var i = 0; i < Math.min(_self.pageSize, _self.collection.length); i++) {
                carousel += '' +
                    '<div class="z-plane" data-collection-index="' + i + '" data-z-index="' + _self.collection[i].zIndex + '">' +
                        '<img src="./images/thumbnail.png" class="z-plane-image">' +
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
        zPlaneInfo.innerHTML = 'Z index: <span id="main-image-z-index">' + _self.mainImageZIndex + '</span> <span style="opacity: 0.5;">(total of ' + _self.totalCount + ' generated)</span>';
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

        // TODO create the static images for POC
        // use the _self._styles to position the buttons

        var zPlaneInfo = '' +
            '<div class="z-plane-info-container" id="z-plane-info-container">' +
            '</div>';

        // TODO attached onClick events to the previous & next buttons
        var zPlaneCarousel = '' +
            '<div class="z-plane-carousel">' +
                '<div id="z-plane-loader" class="z-plane-loader">' +
                    '<img class="loader-image" src="./images/loader.gif">' +
                '</div >' +
                '<button class="button-container" id="previous-button">' +
                    '<i class="fa fa-angle-left vertical-align-center"></i>' +
                '</button>' +
                '<div class="z-plane-container" id="z-plane-container">' +
                '</div>' +
                '<button class="button-container" id="next-button">' +
                    '<i class="fa fa-angle-right vertical-align-center"></i>' +
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

        _self.elem = ""; // TODO the element that you created
        // TODO create the reszieSensor here
    };

}