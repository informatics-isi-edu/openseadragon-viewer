# Developer Guide

This document is designed for developers that work on openseadragon-viewer. It will include implementation details and details about the concepts that the developers should be familiar with.

## Table of contents

* [Test cases](#test-cases)
* [General information](#general-information)
   + [Terminology](#terminology)
   + [Image processing pipeline](#image-processing-pipeline)
   + [How DZI images work](#how-dzi-images-work)
      - [Tile Pyramid](#tile-pyramid)
      - [How deriva platform support DZI](#how-deriva-platform-support-dzi)
   + [How IIIF images work](#how-iiif-images-work)
      - [Image request](#image-request)
      - [Image information request](#image-information-request)
      - [How OSD viewer supports IIIF](#how-osd-viewer-supports-iiif)
   + [Channel filter and color](#channel-filter-and-color)
   + [vector-effect](#vector-effect)
* [Code details](#code-details)
   + [Overview](#overview)
   + [Communication](#communication)
   + [Communication b/w different components](#communication-bw-different-components)
   + [Viewer folder](#viewer-folder)
   + [How Channels work](#how-channels-work)
   + [Multi-Z](#multi-z)

## Test cases

You can find the regression tests in [here]( https://github.com/informatics-isi-edu/chaise/wiki/Viewer-regression-tests).

## General information
This section will focus on general information and concepts that developers should be familiar with.

### Terminology
- **CZI**: a single file from the Zeiss microscope vendor (Carl Zeiss Image format). openseadragon doesn't directly work with this type of file.
- **DZI**: Deep Zoom Image format is the format that openseadragon understands using the imageProperties.xml file. The CZI files are converted to DZI so openseadragon can process them.
- **TIFF dialect**: just a specific "profile" of TIFF that the IIIF server understands. At runtime, IIIF reads TIFFs and recomputes outputs based on its own rest API.
- **Channel**: Color digital images are made of pixels, and pixels are made of combinations of primary colors represented by a series of code. A channel in this context is the grayscale image of the same size as a color image, made of just one of these primary colors. For instance, an image from a standard digital camera will have a red, green and blue channel. A grayscale image has just one channel. To simplify this, a captured raw image is usually composted of multiple layers. In osd-viewer, these layers are called channels and the displayed image is the result of adding all these layers on top of each other.
- **Multi-z/Z-stack/Z-plane/Z-index**: Since the osd-viewer is only capable of showing 2D images, to display a 3D image, different 2D images are captured in different Z values. And then we would show these 2D images for all the captured Z values.

### Image processing pipeline

Before being able to display the images using the openseadragon-viewer (OSD-viewer), the raw images go through a processing pipeline. You can find more information [here](https://github.com/informatics-isi-edu/rbk-project/wiki/Image-Processing).

As part of the processing pipeline:
- We start with the raw CZI or other vendor files
- We then convert them to TIFF dialect, and store them in apache or hatrac server.
- We add these images to the IIIF image server.
- And in the end, the osd-viewer will use the IIIF image server to display the images.

This is compared to the legacy code where we would convert CZI images to DZI. That's why the osd-viewer is also capable of handling DZI images.

### How DZI images work

source: [Microsoft DZI format overview](https://docs.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc645077(v=vs.95)?redirectedfrom=MSDN), [OSD DZI wiki page](https://github.com/openseadragon/openseadragon/wiki/The-DZI-File-Format)

Single large images in Deep Zoom are represented by a tiled image pyramid. This allows the Deep Zoom rendering engine to grab only that bit of data that is necessary for a particular view of an image. If an image is being viewed zoomed out very far, then a small thumbnail is all that’s needed to show the image on the screen.

However, if the user is zoomed in to a specific area of a large image, then only those tiles needed to show the specific areas are downloaded. This can lead to very large bandwidth savings because often only some aspects of a large image are interesting to the user. The illustration below shows what the image pyramid looks like conceptually. An image is stored as a tiled image pyramid. At each level of the pyramid, the image is scaled down by 4 (a factor of 2 in each dimension). Also, the image is tiled up into 256x256 tiles.

If, for example, you were zoomed in to see only the highlighted middle part of the image, Deep Zoom only loads the highlighted tiles, instead of the entire 1024x1024 image.

#### Tile Pyramid
When creating a DZI image, you specify a size, format, and overlap. The conversion tool then goes through the image, breaking it into tiles. It starts with the full resolution image and starts creating tiles from the upper left corner, with the first tile being 0_0, the next in the top row being 1_0, etc. The first tile on the next row is 0_1, etc. This becomes the highest-numbered layer.

The tool then scales the image down to half width, rounding odd-sized image sizes up, and runs through and tiles it again, using the same numbering system. This becomes the next level.

The tool continues scaling down by half and outputting new levels until the image is down to approximately 1px wide. This is the lowest level, and it's designated level 0. The next level above it is level 1, etc.

#### How deriva platform support DZI

The DZI images generated from the original CZI are organized in a folder structure that reflects the tile level, x, and y. The following is how each tile image is organized:

```
<server>/<path-to-dzi-xml-file>/<level>/<x>_<y>.jpg
```

So, the OSD viewer code is using the `getTileUrl` API of OSD to construct the URL.

### How IIIF images work

source: [IIIF API](https://iiif.io/api/image/3.0/)

The International Image Interoperability Framework (IIIF, pronounced “Triple-Eye-Eff”) Image API specifies a web service that returns an image in response to a standard HTTP or HTTPS request. The URI can specify the region, size, rotation, quality characteristics, and format of the requested image. A URI can also be constructed to request basic technical information about the image to support client applications.

#### Image request

This request will return the image using the following format:

```
{scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
```

Please refer to [this doc](https://iiif.io/api/image/3.0/#4-image-requests) for more information about the parameters.


#### Image information request

This request will return some metadata about the image. The URI for requesting image information is using the following URI template:

```
{scheme}://{server}{/prefix}/{identifier}/info.json
```

For example:
```
https://dev.rebuildingakidney.org/iiif/2/https%3A%2F%2Fimaging-dev.gudmap.org%2Fcompression%2F16-2GHG%2F70%2F1024%2Fome_tiff%2F20160608-hKD15wWT_-CDL-0-01-000-s0-z0-c0.ome.tif/info.json
```

#### How OSD viewer supports IIIF

OSD viewer passes the "Image information request URL" (the one with `info.json`) to OSD. Then OSD creates a URL to get the actual tiles based on the displayed region and zoom level. Internally OSD is creating tiles based on their `level`, `x`, and `y` (the same as DZI images.) But for requesting the IIIF image, as described previously, we need other information. So OSD is translating these three attributes of each tile, to a proper IIIF request. For example, let's assume we're looking at an image with the following properties:
```
{
  "height": 42243,
  "width": 36150,
  "tileSize": 512
}
```
(maximum level would be 9)

The request for getting the upper left tile when the image is all the way zoomed in would be

```
level= 9, x=0, y=0
```

Which would translate to

```
https://image-server.com/iiif/2/image-identifiter/0,0,512,512/512,/0/default.jpg
```

### Channel filter and color

You most probably are familar with the RGB color model, where the red, green, and blue
primary colors of light are added together to produce the color. Another popular
color model that we're using in osd-viewer is HSV (for hue, saturation, value;
also known as HSB, for hue, saturation, brightness).

In this model,
- Hue is a degree on the color wheel from 0 to 360. 0 is red, 120 is green, 240 is blue.
- Saturation is a percentage value where 0% means a shade of gray and 100% is the full color.
- Brightness/value is a percentage value indicating the "brightness" of the color.
  - 0% brightness is black regardless of saturation or hue.
  - 100% brightness is white only if saturation is also 0%. Otherwise, 100% brightness is just a very bright color. For more technical explanation please refer to [this wikipedia page](https://en.wikipedia.org/wiki/HSL_and_HSV).

As you can see, the Hue is what can be generally conceived as the "color", where the other attributes will just change the density or colorfulness of the color. So in the channel code, we convert the given "RGB" color into "HSV". And then the colors will manipulate the values of H, S, or V.

### vector-effect
It is a SVG style property which defines how object are drawn. `vector-effect:non-scaling-stroke` is used when we want the objects to be drawn according to the host coordinate system, i.e. stroke-width of the object is not affected by transformations like zoom in and zoom out.

Annotation Thickness Implementation

While reading a file for each object check if it has a vector-effect property of not. If it does then no changes are made. If it does not then then add `vector-effect: non-scaling-stroke`, which allows the components of the SVG to be displayed according to the screen (i.e. monitor) display. This is to make sure that small line eg 1px, are visible even if the image is large.

While writing an output SVG this property is not added. We are not even adding `vector-effect: none`, because that would lead to our own software displaying it with that property. This allows 3rd party softwares to handle the above mentioned scenario on their own.

## Code details

This section will focus on how the OSD-viewer code is working and will go over the implementation details that we think are useful for developers.

### Overview
OSD viewer app has two main components:
1. [Viewer app](https://github.com/informatics-isi-edu/chaise/tree/master/viewer) - the container app
2. [Openseadragon viewer](https://github.com/informatics-isi-edu/openseadragon-viewer) - the view which shows the image/scene.
The Viewer app has the toolbar/actions and the left panel for the annotations to be displayed (given there are annotations.)
The openseadragon viewer controls the actual values of the actions and showcases them.

The openseadragon viewer entry point is `mview.html`. The data is rendered via javascript.
- The [`app.js`](https://github.com/informatics-isi-edu/openseadragon-viewer/blob/master/js/app.js) initializes the `toolbar` and `viewer`.
- The [`config.js`](https://github.com/informatics-isi-edu/openseadragon-viewer/blob/master/js/config.js) provides all the config to be used by the utils folder.

### Communication
The viewer app in chaise and the osd viewer app communicate by posting messages with a `type`.

From one app, we send the data :
```javascript
 window.parent.postMessage({messageType: type, content: data}, window.location.origin);
```
and add a listener in the other one :
```javascript
 window.addEventListener('message', function_to_handle_message);
```

### Communication b/w different components

`dispatchEvent` function is used throughout the viewer app to pass message between different components. This function normally has 2 parameters:
1. type: this determines which function to call
2. data: the data which is passed along with the function being called

Eg.
```
dispatchEvent("toggleDrawingTool", data)
```

[This](https://github.com/informatics-isi-edu/openseadragon-viewer/blob/e346e10d4d6d992c86fa146bf1c1b63263f8b48e/js/viewer/viewer.js#L478) function call is used to toggle the drawing toolbar in OSD viewer. The data here has a value stroke which determines the color of the new annotation that will be drawn.

### Viewer folder

`viewer.js` contains most of the functionalities of OSD viewer. It will,
  - load the images based on the file type of image i.e. `czi`, `tiff`, `jpg` etc.
  - set up the initial values of each channel for the scene ([channel folder](https://github.com/informatics-isi-edu/openseadragon-viewer/tree/master/js/viewer/channel) is used)
  - fix position of the annotation in the scene ([annotations folder](https://github.com/informatics-isi-edu/openseadragon-viewer/tree/master/js/viewer/annotation) is used to create the svg overlay)
  - osd specific actions like zoom in, zoom out, screenshot etc.

### How Channels work

While initializing the viewer app, the `loadImages` function is called which loads the image as well as the channel information.
  - For `dzi` images: creates a `tileSource` object based on properties of `ImageProperties.xml`. Some properties are also used for modifying the channel and scale.
  - For `iiif` images:  creates a `tileSource` by using the URL.
  - For other images: crease a `tileSource` by specifying the type and using the URL.

When creating a new channel `tileSource` is passed as one of the parameters to the function. It is used to define the channel properties like  `name`, `rgb` and `opacity`. Based on the value of `rgb` the `hue` is set. If `rgb` is not defined then `name` is used to define it. Therefore it is necessary to have the proper `name` (channel name) passed through `ImageProperties.xml` or it could cause issues with the `hue`, issue like `hue` being un-defined and therefore not being displayed. The default value of `gamma` is set to 0.875, but it is changed if `name` is present in the list of channels that we are currently handling:
1. `Red`: Rhodamine, RFP, Alexa Fluor 555, Alexa Fluor 594, tdTomato, Alexa Fluor 633, Alexa Fluor 647
2. `green`: FITC, Alexa 488, EGFP, Alexa Fluor 488
3. `blue`: DAPI

After all the channels are populated, the `updateChannelList` event is called which updates the channel values in `toolbar.controler.js`. The toolbar creates the UI for showing the channels in the OSD, which includes the UI (sliders) for controlling the different parameters of the Channel like hue, contrast etc. When the slider is used to change one of these values, `changeOsdItemChannelSetting` event is fired which causes the values stored in the viewer to change and resetting the filter values.

Once the channel objects are created, these are passed to `setItemChannel` which converts the channel data into filter data that is needed by `OpenSeadragonFiltering` (It the library responsible for handling these channels).

When the `hue` (or any of the properties) is changed, a message is passed from the `channel-item` to the viewer app with the updated values of the channel's property. The `setItemChannel` is called to update these values in the viewer and the properties are set again with the new values.


#### Property Description for ImageProperties.xml

This is what an `ImageProperties.xml` for a channel looks like.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<IMAGE_PROPERTIES
    width="70004"
    height="22244"
    meterScaleInPixels="3083629.230769"
    numTiles="8076"
    numImages="1"
    version="2.0"
    tileWidth="512"
    tileHeight="512"
    levelScale="2"
    minLevel="0"
    maxLevel="5"
    channelName="Alexa Fluor 647"
    channelDefaultAlpha="1.000000"
    channelDefaultRGB="0.000000 0.000000 1.000000"
    minValue="0.0"
    maxValue="1.0"
    data="/var/www/html/data/Immunofluorescence/2018/474b444175caa8f2f6ae7d81fc80f35d/AF647"
/>
```

1. `width`: it is passed to the channel, & it defines the width for the image in viewport coordinates for OSD
2. `height`: it is passed to the channel, & it defines the height for the image in viewport coordinates for OSD
3. `meterScaleInPixels`: used to define the viewer meterScaleInPixels value
4. `channelDefaultAlpha` -> `channelAlpha` = the opacity of the channel
5. `channelDefaultRGB` -> `channelRGB` = the rgb value of the channel
6. `getTileUrl`: this function makes sure that the OSD views the tilesource object passed to the function as a custom tileSourse.
7. `maxLevel`: this value is used by buildTileSource to override the getLevelScale of OSD.
8. `format`: used in getTileUrl


Notes:
- `tileWidth` & `tileHeight` when commented out cause an error, so this means that they are used, whereas commenting `dir`/`data`, `minValue`, `maxValue` out, did not cause any error. More research needs to be done to find out how tileWidth & tileHeight are being used by the `OSD`.

- `data` is the location based on the file system on the server and it's not used by OSD viewer. OSD viewer assumes that the images are stored in the same folder as the `ImageProperties.xml` file. So if the given path for `ImageProperties.xml` is `/some/path/to/ImageProperties.xml`, we're going to look fro the images under `/some/path/to/` folder.

#### How channel filters are applied

In [Channel filter and color](#channel-filter-and-color) we explained how the HSV format can
be used for manipulating the displayed color on the image. In the following we will go
into more detailed on how this manipulation is done in channel filters.

Before asking OpenSeadragon to display the image, as part of `channel-filter.js` code, we will apply additional filters. These filters will manipulate the displayed colors of each pixel based on the user input. These manipulations are all done in the HSV/HSB format, where we change the "Hue", "Saturation", and "Value/Brightness" color model value of each pixel to get the final displayed image. The following are the controls tha we currently offer and how they work:

- Hue: Allows the modification of "Hue" color model for each pixel. The selected value is used without any modification.
- Saturation: Allows the modification of "Saturation" color model for each pixel. The selected value is used without any modification.
- Greyscale toggle: This checkbox allows users to see the original greyscale image. When active, it will use the image's original Hue value and sets the Saturation to 0.
- Intensity range and Gamma: The selected values of these inputs will change the "Value/Brightness" of the color model for each pixel using the following format:
  ```js
  /**
   * more information: https://github.com/informatics-isi-edu/openseadragon-viewer/issues/62
   * users can select:
   * - whiteLevel: The upper bound of the selected range (0-255)
   * - blackLevel: The lower bound of the selected range (0-255)
   * - gamma: a value from 0 to 3. used as a exponent
   *
   * input is the value of "Value/Brightness" for the original image.
   * output is the value that is used in the end
   */
  blackLevel = blackLevel / 255;
  whiteLevel = whiteLevel / 255;
  var contrast = 1 / (whiteLevel - blackLevel);
  var brightness = -1 * contrast * blackLevel;

  output = Math.pow( (contrast * input) + brightness , gamma)
  ```



If the displayed image is RGB, then the value of Hue and Saturation are already encoded in the image data, and therefore it doesn't make sense to allow users to modify them. That's why we're not offering them in this case.


### Multi-Z

The multi-Z documentation has been moved to [here](multi-z.md).
