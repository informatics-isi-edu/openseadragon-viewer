## Multi Z

An image can have various z indexes and introducing this feature has allowed the user to:
1. See all the z indexes
2. Switch between indexes
3. Jump to a particular index

When the user clicks on an image, if the image has multiple z indexes, then the user will be shown a `z plane list` (carousel) below the main image showing the following details:
1. Current Z index of the image
2. Number of generated indexes
3. A list of z indexes around the current z index.

When the page is loaded, we have a `default z index` (this is the index which is shown by default whenever a page is laoded), a request is sent to `chaise` to get a list of  indexes around the `default z index`. 'Around' here means that, if for eg the default z index = 11 and the `pageSize` (the number of z indexes that can be shown in the z plane list) is 5, then the z indexes shown to the user in the z plane list would be [9, 10, 11, 12, 13].

TODO: Ask where to mention about different annotation for each index and channel configuration

### Click on a Z index
The user here has the ability to switch between the z indexes shown in the z plane list, by clicking on any one of them. When the user clicks on a different index, the image shown in the `OSD viewer` changes. 

### Next and Previous Buttons
The list shown to the user is paginated, therefore the user can see other available indexes by clicking on the previous or next arrows (present on either side of the list). These arrows are enabled/disabled depending the values of `hasNext` and `hasPrevious`, which determine if there are indexes with value greater than the last index in the list and less than the first element in the list, respectively. When they are disabled, the user cannot click on them.

### Z index input field
Right below the main image, there is an input field which by default shows the value of the z index currently being displayed. The user can enter a desired z index, and on pressing `enter` or clicking on the button next to it will be taken to that index. Only non-negative intergers are allowed in this input field.

If the user enters a z index which is not present then an error message will be shown to the user, and the current z index would change to a value most closest to the input, and the z plane list would be centered around that value.

### Change Page Size
When the width of the page is increased on decreased, the list of z planes shown to the user also change. 
1. When the `pageSize` is increased (size of the window is increased), a request is sent to `chaise` to fetch more z indexes. Before sending this request, `appendData` is set to `true` indicating the indexes need to be appended to the existing values. When the resposnse arrive, new indexes are added to the existing `collection` to fill up the empty space in the list (carousel), and `appendData` is reset to `false`.
2. When the `pageSize` is decreased, indexes are removed from the `collection` to have only the appropriate number of indexes. Since no new data is required in this case, no request is sent.

### Request Handling
	
 - Whenever a fetch request is being processed, a loader is shown over the z plane list (disabling any click on z index or prev/next button) and the z plane input is also disabled.
 - Each request sent to `chaise` has a `requestID` associated with it, to ensure concurrency. For eg, if the `pageSize` is increased from 5 -> 8 (request r1), and before this request has been satisfied, the `pageSize` is changed again to 10 (request r2). The response from `r2` would be used.
 - When the user inputs a z index (in the Jump to Z index input field) a request (r1) is sent to fetch the data. However, while this request is being processed, the use changes the size of the page. If this case a new request (r2 which is a copy of r1) to sent, with all the original values expect for `pageSize` and `requestID`.