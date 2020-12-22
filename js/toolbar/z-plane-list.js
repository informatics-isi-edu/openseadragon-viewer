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
    this._calculatePageSize = function () {
        // TODO based on the container size figure out the number of images that we should ask
        _self.pageSize = 5;
    };

    /**
     * click handler for when an image is selected
     */
    this._onclickImageHandler = function (index) {
        // TODO highlight the image
        _self.mainImageZIndex = _self.collection[zIndex];

        // ask viewer to change the image
        _self.parent.dispatchEvent('updateMainImage', {
            image: _self.collection[index]
        });
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
     * render the element
     */
    this._render = function () {
        _self._showSpinner(false);

        // TODO (later) based on the type of images we show the thumbnails or not

        // TODO create the static images for POC
        // use the _self._styles to position the buttons

        _self.elem = ""; // TODO the element that you created
        // TODO create the reszieSensor here
    };

}
