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

    this.doit;

    this._zPlaneContainer = document.getElementById('z-planes-container');
    this._resizeSensorContainer = document.getElementById('resize-sensor');
    new ResizeSensor(_self._resizeSensorContainer, function () {
        clearTimeout(_self.doit);
        _self.doit = setTimeout(function () {
            _self._calculatePageSize(_self._resizeSensorContainer.clientWidth - 70);
        }, 200);
    });

    /**
     * called on load to calculate the page size and then ask chaise to fetch the results
     */
    this.init = function (data) {
        _self.totalCount = data.totalCount;
        _self.mainImageZIndex = data.mainImageZIndex;
        _self._fetchList({});
    }

    /**
     * after request is done in chaise, this will be called to show the result
     */
    this.updateList = function (data) {
        console.log("updating the z-plane-list with the following data:", data)
        this.collection = data.images;
        this.hasPrevious = data.hasPrevious;
        this.hasNext = data.hasNext;

        // if this the first time rendering, we should adjust the pagesize based on what we got
        // our calculations might not be correct as what's in database might be less than total count
        if (_self.elem == null) {
            _self.pageSize = data.images.length;
            _self._setContainerStyle();
        }

        this._render();
    };

    /**
     * change the state of spinner
     */
    this._showSpinner = function (display) {
        // TOOD based on display change the class to show/hide the spinner
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
        console.log('width = ', width, _self._zPlaneContainer.offsetWidth - 70);
        width = width ? width : _self._zPlaneContainer.offsetWidth - 70;
        var totalWidthOfSingleIndex = _self._thumbnailProperties.width + 2 * (_self._carouselStyle.padding + _self._carouselStyle.margin + 2);
        var pageSize = Math.floor(parseFloat(width)/totalWidthOfSingleIndex);
        if (pageSize != _self.pageSize) {
            _self.pageSize = pageSize;
            console.log('new page size = ', pageSize);
            _self._renderZPlaneCarousel();
        } else {
            // TODO update margin between 2 indexes
        }
    };

    /**
     * click handler for when an image is selected
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

        if (index != _self.mainImageZIndex) {
            console.log(index);
            _self.mainImageZIndex = index;
            _self._renderZPlaneInfo();
            _self._renderActiveZPlane(index);
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

    this._renderZPlaneCarousel = function () {
        var carousel = '';

        for (var i = 0; i < _self.pageSize; i++) {
            carousel += '' +
                '<div class="z-plane">' +
                    '<img src="./images/thumbnail.png" class="z-plane-image">' +
                    '<div class="z-plane-id">' +
                        (i+1).toString() +
                    '</div>' +
                '</div>';
        }

        var zPlaneContainer = document.getElementById('z-plane-container');
        zPlaneContainer.innerHTML = carousel;
        zPlaneContainer.querySelectorAll(".z-plane").forEach(function (elem) {
            elem.addEventListener('click', function() {
                _self._onclickImageHandler(parseInt(elem.children[1].innerHTML));
            });
        }.bind(this))
        _self._renderActiveZPlane(_self.mainImageZIndex);
        _self._renderNextPreviousButtons();
    }

    this._renderZPlaneInfo = function () {
        var zPlaneInfo = document.getElementById('z-plane-info-container');
        zPlaneInfo.innerHTML = 'Z index: <span id="main-image-z-index">' + _self.mainImageZIndex + '</span> <span style="opacity: 0.5;">(total of ' + _self.totalCount + ' generated)</span>';
    }

    this._renderNextPreviousButtons = function() {

        // TODO get the elements properly and not by using getElementById
        var previousButton = document.getElementById('previous-button');
        previousButton.classList.remove('disabled', 'active-button');
        if (_self.hasPrevious) {
            previousButton.classList.add('active-button');
        } else {
            previousButton.classList.add('disabled');
        }
        

        var nextButton = document.getElementById('next-button');
        nextButton.classList.remove('disabled', 'active-button');
        if (_self.hasNext) {
            nextButton.classList.add('active-button');
        } else {
            nextButton.classList.add('disabled');
        }
    };

    this._renderActiveZPlane = function(index) {
        _self._zPlaneContainer.querySelectorAll('.z-plane').forEach(function (elem) {
            if (parseInt(elem.children[1].innerHTML) == index) {
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
        _self._showSpinner(false);

        // TODO (later) based on the type of images we show the thumbnails or not

        // TODO create the static images for POC
        // use the _self._styles to position the buttons

        var zPlaneInfo = '' +
            '<div class="z-plane-info-container" id="z-plane-info-container">' +
            '</div>';

        // TODO attached onClick events to the previous & next buttons
        var zPlaneCarousel = '' +
            '<div class="z-plane-carousel">' +
                '<div class="button-container" id="previous-button">' +
                    '<i class="fa fa-angle-left vertical-align-center"></i>' +
                '</div>' +
                '<div class="z-plane-container" id="z-plane-container">' +
                '</div>' +
                '<div class="button-container" id="next-button">' +
                    '<i class="fa fa-angle-right vertical-align-center"></i>' +
                '</div>' +
            '<div>';

        _self._zPlaneContainer.innerHTML = zPlaneInfo + zPlaneCarousel;

        // TODO use resizeSensor
        // window.addEventListener("resize", function() {
        //     clearTimeout(_self.doit);
        //     _self.doit = setTimeout(function () {
        //         _self._calculatePageSize(_self._zPlaneContainer.offsetWidth - 70);
        //     }, 200);
        // });

        _self._renderZPlaneInfo();
        _self._renderZPlaneCarousel();

        _self.elem = ""; // TODO the element that you created
        // TODO create the reszieSensor here
    };

}

// var doit;
// function resizedw() {
//     console.log('changed');
//     var div = document.getElementById('z-planes-container');
//     console.log(div.offsetWidth, div.offsetHeight);
// }
// window.onresize = function () {
//     clearTimeout(doit);
//     doit = setTimeout(function () {
//         resizedw();
//     }, 200);
// };

