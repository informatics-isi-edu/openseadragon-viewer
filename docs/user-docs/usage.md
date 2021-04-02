# Usage

The entry point of openseadargon-viewer is the `mview.html` file. openseadragon-viewer is designed as a standalone application that can be initialized through url query parameters, or by using the [cross-window communication](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) APIs to communicate with the parent window (when used in an iframe.) [Chaise viewer app](https://github.com/informatics-isi-edu/chaise/tree/master/docs/user-docs/viewer/viewer-app.md) is using this application by utilizing the cross-window communication.

## Parameters

The following sections will summarize the parameters that can be passed to openseadargon-viewer.

### Channel parameters
Since we support a mulit-channel view of image. There can be multiple values for these query parameters. Each will represent a channel and will modify the settings related to that.

<table>
  <tbody>
    <tr>
      <th>Parameter</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
    <tr>
        <td><strong>url</strong></td>
        <td>URL</td>
        <td>
            (required) one or more input url to an image source. Available image source types:
            <ul>
                <li>dzi images: ImageProperties.xml</li>
                <li>iiif images: info.json</li>
                <li>annotation images: SVG files stored in hatrac</li>
                <li>Any other image source supported by OSD</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td><strong>channelName</strong></td>
        <td>String</td>
        <td>
            set channel name of the matching URL image.  The channel can be any non-empty strings. The following specific channel names can be used for proper color filters:
            <ul>
                <li>
                    far red (magenta): <code>Alexa Fluor 633</code>, <code>Alexa Fluor 647</code>
                </li>
                <li>
                    red: <code>Rhodamine</code>, <code>RFP</code>, <code>Alexa Fluor 555</code>, <code>Alexa Fluor 594</code>, <code>tdTomato</code>, <code>mcherry</code>
                </li>
                <li>
                    green: <code>FITC</code>, <code>Alexa 488</code>, <code>Alexa Fluor 488</code>, <code>EGFP</code>
                </li>
                <li>
                    blue: <code>DAPI</code>, <code>Hoechst</code>
                </li>
                <li>
                    colorized RGB (no hue filter applied): 'TL Brightfield', 'combo'
                </li>
            </ul>
            For dzi images, if the channelName is missing, it will be derived from the ImageProperties.xml file.
            We will apply a "white" hue filter if the channelName is not any of the mentioned values.
        </td>
    </tr>
    <tr>
        <td><strong>aliasName</strong></td>
        <td>string</td>
        <td>
            set name to be used for pull-out listing for this URL image
        </td>
    </tr>
    <tr>
        <td><strong>isRGB</strong></td>
        <td>boolean</td>
        <td>
            set <code>true</code> to avoid applying any hue filter and use the image as is.
        </td>
    </tr>
    <tr>
        <td><strong>pseudoColor</strong></td>
        <td>string</td>
        <td>
            set the hue color filter that should be applied. The color value must be in <a target="_blank" href="https://en.wikipedia.org/wiki/Web_colors#Hex_triplet">Hex triplet format</a>, e.g., <code>#00ff00</code>. This will override the default color that might be dictated by the <code>channelName</code>. If <code>isRGB</code> is set to <code>true</code>, this variable will be ignored.
        </td>
    </tr>
  </tbody>
</table>

### General parameters

The following are general parameters that will be applied to the whole view:

> If you want to suppress the default value of each one, you can pass `null` as a value.

<table>
  <tbody>
    <tr>
      <th>Parameter</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
    <tr>
        <td><strong>x</strong></td>
        <td>float</td>
        <td>
            set initial X
        </td>
    </tr>
    <tr>
        <td><strong>y</strong></td>
        <td>float</td>
        <td>
            set initial y
        </td>
    </tr>
    <tr>
        <td><strong>z</strong></td>
        <td>float</td>
        <td>
            set initial zoom
        </td>
    </tr>
    <tr>
        <td><strong>meterScaleInPixels</strong></td>
        <td>float</td>
        <td>
            set scale, pixels in a meter, usually set within DZI's metadata
        </td>
    </tr>
    <tr>
        <td><strong>waterMark</strong></td>
        <td>string</td>
        <td>
            set watermark to add credit to snapshot jpg image
        </td>
    </tr>
    <tr>
        <td><strong>scale</strong></td>
        <td>float</td>
        <td>
            This scale corresponds to the unit used in the provided SVG. For example, a given <code>viewBox (0, 0, 3830.84, 4059.58)</code> and a <code>scale=0.21951</code> will convert to <code>width=17451</code> and <code>height=18493</code>
        </td>
    </tr>
    <tr>
        <td><strong>ignoreReferencePoint</strong></td>
        <td>boolean</td>
        <td>
            set <code>true</code> (default) to ignore the reference point in the svg <code>viewBox</code>, which the upper-left point will be <code>0,0</code>. set to false to honor the provided upper-left point. If set to <code>false</code> and <code>scale</code> is provided, the reference point will be converted based on the provided scale.
        </td>
    </tr>
    <tr>
        <td><strong>ignoreDimension</strong></td>
        <td>boolean</td>
        <td>
            set <code>true</code> (default) to ignore the provided width and height in the svg <code>viewBox</code>, which the bottom-right point will be the size of image width and height. set <code>false</code> to honor the provided bottom-right point. If set to <code>false</code> and <code>scale</code> is provided, the bottom-right point will be converted based on the provided scale.
        </td>
    </tr>
    <tr>
        <td><strong>enableSVGStrokeWidth</strong></td>
        <td>boolean</td>
        <td>
            set <code>false</code> (default) to ignore the <code>stroke-width</code> present in the SVG file, which implies that the SVG drawn in the OSD will use <code>DEFAULT_LINE_THICKNESS</code> defined as a constant in the system as the <code>stroke-width</code>. If set to <code>true</code>, it will use the <code>stroke-width</code> mentioned in the SVG file.
        </td>
    </tr>
    <tr>
        <td><strong>zoomLineThickness</strong></td>
        <td>string</td>
        <td>
            The value of this param decides which function should be used to determine the line thickness at a particular zoom level.
            <ul>
                <li>
                    <code>log</code>: the thickness vaires according to the log of the current zoom level. Since at each zoom in/out the zoom level changes by a factor of 2, i.e. it changes exponentially, therefore using a log approach provides linear change in line-thickness with respect to each zoom in/out click.
                </li>
                <li>
                    <code>default</code>: using the original function, i.e. mapping the line thickness linearly with the total zoom levels avaibale in the OSD
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td><strong>showHistogram</strong></td>
        <td>boolean</td>
        <td>
            set <code>true</code> to display the intensity histogram debugging tool.
        </td>
    </tr>
</table>

### Usage of the `scale`, `ignoreReferencePoint`, `ignoreDimension` parameters

- **Case 1 : Provided SVG has the same aspect ratio as the loaded `tif` image**

  - Assumption:
    - the `svg` and `tif image` has same proportional relationship between the image's width and height. In this case, `openseadragon` will scale the `svg`, so that its `upper-left point`, `bottom-right point`, `width` and `height` are the same with the loaded `tif images`
  - Usage
    - `scale` is not needed
    - `ignoreReferencePoint` set to `true`
    - `ignoreDimension` set to `true`


- **Case 2 : Provided SVG has differnt unit in origin point and dimension**

  - Assumption:
    - the `svg`'s `origin point` and `dimension` need to be converted into pixels. In this case, the `scale` parameters will need to be provided in order to do the conversion.

  - Usage
    - `scale` is needed
    - `ignoreReferencePoint` set to `false`
      - the `upper-left point` will be converted into pixels based on the provided `scale`
    - `ignoreDimension` set to `false`
      - the svg `width` and `height` will be converted into pixels with the provided `scale`

- **Case 3 : Provided SVG has a same unit origin point, but with a different unit dimension**

  - Assumption:
    - The given `upper-left point` of the `svg` should be at `0,0` as the `tif image` and the provided `width` and `height` are in different unit and therefore need to be converted into pixels.

  - Usage
    - `scale` is not needed
    - `ignoreReferencePoint` set to `true`
    - `ignoreDimension` set to `false`
      - the dimension will be converted into pixels using the `scale` provided
