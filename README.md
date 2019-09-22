# openseadragon-viewer

  A 2D viewer based on OpenSeadragon with image annotation capability from
Annotorious, in-time filtering from OpenSeadragonFiltering plugin,
in-view scalebar from OpenSeadragonScalebar plugin and overlaying function
from SVG Overlay plugin.

## Overview

  There are several flavors of the 2D viewer depending on the input and
parameters that are being passed. The description of each  will be explained 
in the Example section.

## Download and Run 

You can clone the source repository with Git by running:

  git clone https://github.com/informatics-isi-edu/openseadragon-viewer.git

## Dependency

http://openseadragon.github.io
  An open-source, web-based viewer for zoomable images, implemented in pure JavaScript, for desktop and mobile.

http://annotorious.github.io
  Image Annotation for the Web.
  local repo copy, https://github.com/informatics-isi-edu/annotorious.git

https://github.com/usnistgov/OpenSeadragonFiltering
  An OpenSeadragon plugin that provides the capability to add filters to the images

https://github.com/usnistgov/OpenSeadragonScalebar
  An Openseadragon plugin that provides the scalebar for the images.
  local repo copy, https://github.com/informatics-isi-edu/OpenSeadragonScalebar

https://github.com/openseadragon/svg-overlay
  An Openseadragon plugin that provides the capability to add images in as an SVG overlay layer 


## Invoking openseadragon-viewer

Paremeters may be passed to openseadragon-viewer as URL query parameters.  

| Parameter | Value | Description |
| --- | --- | --- |
| **url** | URL | one or more input url to an ImageProperties.xml(DZI image pyramid), AnnotationData.xml(third-party annotation data file), or  datafile.jpg(simple image jpg) |
| **x** | float | set initial X |
| **y** | float | set initial Y |
| **z** | float | set initial zoom |
| **MeterScaleInPixels** | float | set scale, pixels in a meter, usually set within DZI's metadata |
| **channelName** | chars | set channel name of the matching URL image.  The channel is either one of ('Rhodamine', 'RFP', 'Alexa Fluor 555', 'Alexa Fluor 594', 'tdTomato', 'Alexa Fluor 633', 'Alexa Fluor 647') for red, one of ('FITC', 'Alexa 488', 'EGFP', 'Alexa Fluor 488' ) for green, one of ('DAPI') for blue or one of ('TL Brightfield' or 'combo') for colorized RGB or if none specified.  This name can also be extracted from ImageProperties.xml |
| **aliasName** | chars | set name to be used for pull-out listing for this URL image |
| **waterMark** | chars | set watermark to add credit to snapshot jpg image |
| **scale** | float | This scale corresponds to the unit used in the provided SVG. For example, a given `viewBox (0, 0, 3830.84, 4059.58)` and a `scale=0.21951` will convert to `width = 17451` and `height=18493`
| **ignoreReferencePoint** | boolean | set `true` (default) to ignore the reference point in the svg `viewBox`, which the upper-left point will be `0,0`. set to `false` to honor the provided upper-left point. If set to `false` and `scale` is provided, the reference point will be converted based on the provided scale. 
| **ignoreDimension** | boolean | set `true` (default) to ignore the provided width and height in the svg `viewBox`, which the bottom-right point will be the size of `tif` image width and height. set `false` to honor the provided bottom-right point. If set to `false` and `scale` is provided, the bottom-right point will be converted based on the provided scale.

## Usage of the `scale`, `ignoreReferencePoint`, `ignoreDimension` parameters

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




## Example of ImageProperties.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<IMAGE_PROPERTIES
                    width="18575" 
                    height="23971" 
                    numTiles="2359" 
                    numImages="1" 
                    version="2.0" 
                    meterScaleInPixels="402738.62263391056"
                    tileWidth="512" 
                    tileHeight="512" 
                    levelScale="2"
                    channelName="combo"
                    minLevel="0" 
                    maxLevel="6" 
                    data="real3/DZI"
/>
```

## Example of AnnotationData.xml

```
<?xml version="1.0" encoding="ISO-8859-1"?>
<mbf version="4.0" xmlns="http://www.mbfbioscience.com/2007/neurolucida" xmlns:n
l="http://www.mbfbioscience.com/2007/neurolucida" appname="Stereo Investigator" 
appversion="2016.0 SfN (64-bit)">
<description><![CDATA[]]></description>
<filefacts>
  <sectionmanager currentsection="" sectioninterval="0" startingsection="0"/>
</filefacts>
<images>
  <image>
    <filename>C:\Users\susan\Downloads\c97ca0f5e7f4f4e8aa19aad76c086f55319e14859
d938babc05050f6dd12e7a8.czi</filename>
    <channels merge="no">
      <channel id="red" source="none"/>
      <channel id="green" source="none"/>
      <channel id="blue" source="none"/>
    </channels>
    <scale x="0.219522" y="0.219522"/>
    <coord x="0.000000" y="0.000000" z="0.000000"/>
    <zspacing z="0.000000" slices="1"/>
  </image>
</images>
<thumbnail cols="64" rows="64">
...
</thumbnail>
<contour name="Layer" color="#00FFFF" closed="true" shape="Contour">
  <property name="GUID"><s></s></property>
  <property name="FillDensity"><n>0</n></property>
  <point x="4162.14" y="-482.95" z="0.00" d="38.40"/>
...
  <point x="4012.86" y="-516.32" z="0.00" d="38.40"/>
  <point x="4160.38" y="-484.70" z="0.00" d="38.40"/>
</contour>
<contour name="Layer" color="#00FFFF" closed="true" shape="Contour">
  <property name="GUID"><s></s></property>
  <property name="FillDensity"><n>0</n></property>
  <point x="4313.17" y="-4378.15" z="0.00" d="7.02"/>
  <point x="4313.17" y="-4381.66" z="0.00" d="7.02"/>
</contour>
<contour name="Layer" color="#00FFFF" closed="true" shape="Contour">
  <property name="GUID"><s></s></property>
  <property name="FillDensity"><n>0</n></property>
  <point x="3775.78" y="-5326.48" z="0.00" d="7.02"/>
  <point x="3775.78" y="-5329.99" z="0.00" d="7.02"/>
</contour>
<contour name="Layer" color="#00FFFF" closed="true" shape="Contour">
  <property name="GUID"><s></s></property>
  <property name="FillDensity"><n>0</n></property>
  <point x="3990.03" y="-5477.51" z="0.00" d="7.02"/>
  <point x="3988.28" y="-5479.27" z="0.00" d="7.02"/>
</contour>
<text color="#008000">
  <font name="Times New Roman" size="72"/>
  <point x="864.36" y="-389.04" z="0.00" d="0.00"/>
  <value>Kidney</value>
</text>
</mbf>
```

## Examples 
(pview.html is used for standalone testing without being embedded in chaise control)

View with a single DZI tiled pyramid  

```
mview.html?url=http://localhost/data/cirm/real3/DZI/ImageProperties.xml
```

View with a single DZI tiled pyramid and a watermark  

```
mview.html?url=http://localhost/data/cirm/real3/DZI/ImageProperties.xml&waterMark='rebuildingakidney.org'
```

View with a single DZI tiled pyramid at a particular focus location  

```
mview.html?url=http://localhost/data/cirm/real3/DZI/ImageProperties.xml&x=0.5&y=0.6452489905787349&z=1.7800585278719854
```


View with a multiple DZI tiled pyramids (multiple channels)  

```
pview.html?url=http://localhost/data/cirm/real3/DZC/DAPI/ImageProperties.xml&url=http://localhost/data/cirm/real3/DZC/Alexa Fluor 488/ImageProperties.xml&url=http://localhost/data/cirm/real3/DZC/Alexa Fluor 555/ImageProperties.xml&url=http://localhost/data/cirm/real3/DZI/ImageProperties.xml
```

View with simple jpg file or files

```
mview.html?url=http://localhost/data/rbk/Sox9-488_Wk8-6.lif-c1-16bit.jpg&channelName=DAPI&meterScaleInPixels=378417.96875
```

View with tiled Images generate from simple images

```
pview.html?url=http://localhost/data/rbk/Sox9-488_Wk8-6.lif-c1-16bit.jpg&channelName=DAPI&aliasName=%27blue%20channel%27&url=http://localhost/data/rbk/Sox9-488_Wk8-6.lif-c2-16bit.jpg&channelName=combo&aliasName=%27red%20channel%27&meterScaleInPixels=378417.96875
```

View with third-party generated annotation markup
(markups have not been consolidated into layers because the grouping logic has not been clarified)

```
pview.html?url=http://localhost/data/otherAnnotator/DZI/Brigh/ImageProperties.xml&url=http://localhost/data/otherAnnotator/AnnotationData.xml
http://localhost/tiletiff/pview.html?url=http://localhost/data/otherAnnotator/DZI/Brigh/ImageProperties.xml&url=http://localhost/data/otherAnnotator/AnnotationData.xml
```

View with SVG overlays generate from simple images

```
pview.html?url=http://localhost/data/gudmap/TS21_WMISH_bladderGREY.jpg&channelName=combo&aliasName=background&url=http://localhost/data/gudmap/TS21_WMISH_bladder_bladder.svg&channelName=bladder&url=http://localhost/data/gudmap/TS21_WMISH_bladder_blepi.svg&channelName=blepi&url=http://localhost/data/gudmap/TS21_WMISH_bladder_blmes.svg&channelName=blmes
```

View with Annotorious annotations

```
http://localhost/tiletiff/pview.html?url=http://localhost/data/cirm/real3/DZI/ImageProperties.xml
```


Sample views are in multiple sampleX.png


