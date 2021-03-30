## Multi Z

An image can have various z indexes and introducing this feature has allowed the user to:
1. See all the z indexes
2. Switch between indexes
3. Jump to a particular index

When the user clicks on an image, if the image has multiple z indexes, then the user will be shown a `z plane list` (carousel) below the main image showing the following details:
1. Current Z index of the image
2. Number of generated indexes
3. A list of z indexes around the current z index.

When the page is loaded, we have a `default z index` (this is the index which is shown by default whenever an image is loaded), a request is sent to `chaise` to get a list of  indexes around the `default z index`. 'Around' here means that, if for eg the default z index = 11 and the `pageSize` (the number of z indexes that can be shown in the z plane list) is 5, then the z indexes shown to the user in the z plane list would be [9, 10, 11, 12, 13].

## Features

### Click on a Z index
The user here has the ability to switch between the z indexes shown in the z plane list, by clicking on any one of them. When the user clicks on a different index, the image shown in the `OSD viewer` changes. When the z index is switched, the channel settings from the previous one are carried forward. Annotations are z index specific, thereofre changing the Z index would cause the annotations to change as well.

### Next and Previous Buttons
The z plane list shown to the user is paginated, therefore to see the other indexes the user has to click on the previous or next arrows (present on either side of the list). These arrows are enabled/disabled depending on the values of `hasNext` and `hasPrevious` variables, which determine if there are indexes with values greater than the last index in the list and less than the first element in the list, respectively. When they are disabled, the user cannot click on them.

### Z index input field
Right below the main image, there is an input field which by default shows the value of the z index currently being displayed. The user can enter a desired z index, and on pressing `enter` or clicking on the button next to, it will switch to that index. Only non-negative intergers are allowed in this input field.

If the user enters a z index which is not present then an error message will be shown, and the current z index would change to a value closest to the input, and the z plane list would be centered around that value. Eg. if the available z indexes are [0, 5, 10, 15, 20] and the user enters 12, then 10 would be shown as it the closest available index to 12.

### Change Page Size
When the width of the page is increased or decreased, the list of z planes shown to the user also changes. The change in the width of the page is determined by the `ResizeSensor`.

### Update Default Z Index
After checking the access control of the user, a button will be shown beside the jump to z index input box, clicking on which will allow the user to default z index that is loaded when the image is loaded. For the button ti show up it is necessary for the user to be logged in.

### Z Plane Slider
On the right side of the z plane info, there is a slider which allow the user to move to any index by changinng the position of the thumb. There are 2 button on the extreme left and right of the slider namely Previous and Next respectively, which allow the user to change the value of the slider on a minute level (i.e. increment or decrement by 1). When the size of the window is reduced below a certain limit the position of the slider shifts to below the z plane info.

### Request Handling
	
- Currently we have 2 z plane fetch requests (explained below).
- Whenever a fetch request is being processed, a loader is shown over the z plane list (disabling any click on z index or prev/next button) and the z plane input is also disabled.
- Each request sent to `chaise` has a `requestID` associated with it, to ensure concurrency. For eg, if the `pageSize` is increased from 5 -> 8 (request r1), and before this request has been satisfied, the `pageSize` is changed again to 10 (request r2). The response from `r2` would be used.
- Initially `requestID` is set 0, and after each request it is incremented by 1.
- When the user inputs a z index (in the Jump to Z index input field) a request (r1) is sent to fetch the data. However, while this request is being processed, the use changes the size of the page. In this case a new request (r2 which is a copy of r1) is sent, with all the original values except for `pageSize` and `requestID` which are changed.


## Implementation details

When the page is loaded, it first calls the `init` function in the OSD zplane

-  `init`

    1. It updates the style of the thumbnail based on the properties of the main image.
    2. Initiallizes the `resizeSensor`, which call the `_calculatePageSize` & `changeContainerHeight` when the page size is change. These functions are explaned below.
    3. It calls `chaise` to fetch the list of z indexes to be shown in the z plane container.

After the call has been made to `chaise`, it process the request and returns the data by calling `updateList` in OSD.

 - `updateList`
    
    1. After recieving a response from `chaise`, it first checks if the requestID of the response matches the ID current requestID. If not, it rejects the resposnse.
    2. Depending on the value of `appendData`, the response is either appended to the `collection` or assigned to it.
    3. It also check whether to update the main image of the OSD or not depending on the value of `updateMainImage`
    4. The response from `chaise` is of the form:
        ```json
        {
            "requestID": "the id (int) of the request to which the data is the response of",
            "images": "the array of images that need to be shown in the z plane list",
            "hasPrevious": "boolean value, which determines if there is/are z planes with index less than the first z plane present in the 'images' array",
            "hasNext": "boolean value, which determines if there is/are z planes with index more than the last z plane present in the 'images' array",
            "updateMainImage": "boolean value, which determines whether the main image needs to be updated or not",
            "mainImageIndex": "if 'updateMainImage' is true, then this gives the index to which the main images needs to be changed to."
        }
        ```

OSD can send 2 types of requestds to fetch new z indexes, fetch list and fetch list by index

- `fetchZPlaneList`

    This function as the name suggests fetches z indexes for the z plane list, It has 2 function parameters `beforeValue` and `afterValue`, which determine if the values that need to be fetched are before or after a given z index. The parameter `pageSize` determines the number of z indexes that will be fetched.

    This function (`requestType`) is used when:
    - next/previous buttons are clicked in the z plane list
    - page size is increased

- `fetchZPlaneListByZIndex`

    This function is used to fetch z indexes around a given `zIndex` which is the parameter. When the request is received, 2 requests are processed, i.e. first to fetch `pageSize` number of z indexes before `zIndex` and second to fetch `pageSize` number of z indexes after `zIndex`. These results are then combined and excess of z indexes are truncated from both the sides, such that the final result would have a `pageSize` number of z indexes.

    This function also causes the main image shown in the OSD to change.

    Eg. `fetchZPlaneListByZIndex(requestID, pageSize = 5, zIndex = 23);`. In this case the 2 sub requests would fetch the following results [19, 20, 21, 22, 23] and [24, 25, 26, 27, 28]. After combining, the final result would have the following z indexes [21, 22, 23, 24, 25], i.e. centered around 23.

    This function (`requestType`) is used when:
    - page is loaded
    - z index is searched

When the user decides to change the with of the window the `resizeSensor` event is fired which calls `_calculatePageSize`.

- `_calculatePageSize`
    
    1. If the width has been reduced, it removes the appropriate number of z indexes from the `collection`
    2. If the size has been increased, it sends a request to `chaise` by calling `fetchZPlaneList`, to get more z indexes to fill up the remaining space.
    3. It is also responsible for maintaining the state of the previous/next button of the z plane list.

When the user enters any z index in the Jump to Z index input box, `fetchZPlaneListByZIndex` is called with the value entered by the user as the parameter.

When the user moves the slider, `fetchZPlaneListByZIndex` is called with the values of the slider as parameter. This changes the content of the z plane list and the main image. When the user clicks on the previous or next button of the slider, we are first checking if that value exists in the current `collection`, if it does we change the focus to that and change the main image. However, if that value does not exist, then we are calling `fetchZPlaneListByZIndex` with the appropriate value.