# Annotation tool

This document will summarize the implementation details related to annotation tools.

## Table of contents

- [Text Annotation](#text-annotation)
  - [Creating a Text Annotation](#creating-a-text-annotation)
    - [Annotation Toolbar Interaction](#annotation-toolbar-interaction)
    - [OSD Canvas Interaction](#osd-canvas-interaction)
    - [Text Input Interaction](#text-input-interaction)
  - [Export/Import of Text Annotations](#exportimport-of-text-annotations)
    - [Export Functionality](#export-functionality)
    - [Import Functionality](#import-functionality)
  - [Additional Resources](#additional-resources)
- [Arrow Line Annotation](#arrow-line-annotation)
  - [Core Changes](#core-changes)
    - [`arrowline.js`](#arrowlinejs)
    - [`base.js`](#basejs)
    - [`mview.html`](#mviewhtml)
    - [`annotation-svg.js`](#annotation-svgjs)
    - [`annotation-group.js`](#annotation-groupjs)
    - [`annotation-tool.js`](#annotation-tooljs)
  - [Notable Updates](#notable-updates)
  - [Fixes and Adjustments](#fixes-and-adjustments)
  - [Additional Resources](#additional-resources-1)


## Text Annotation

This documentation is designed to guide you through the process of creating, saving, and loading text annotations with our application. By following the flow of creating a text annotation, we'll not only explore its feature set but also delve into the underlying code logic.

### Creating a Text Annotation

The creation of a text annotation involves user interactions with three critical components:

1. Annotation Toolbar
2. OSD (OpenSeadragon) Canvas
3. Text Input

#### Annotation Toolbar Interaction

The user can initiate the text annotation creation process by selecting the text annotation option from the toolbar. This selection activates the drawing mode and the related text annotation tools. The toolbar facilitates the user to manipulate the text annotation in the following ways:

1. **Font-size Input**: Users can specify the desired font size directly within the input field. This scaled font size feature allows users to set a size that aligns with other screen elements. Notably, the font size dynamically adjusts according to the image scale, which is elaborated in the code.

2. **Size Adjustment**: The toolbar offers two buttons to either increase or decrease the font size by a predetermined step, typically one unit.

**Code Logic:**

We have event listeners attached to each of the three controls: font size input, increase, and decrease buttons. These listeners are defined in the `annotation-tool.js` file. User interaction with any of these controls triggers the corresponding event listener, which in turn raises an internal event to accomplish the desired action.

#### OSD Canvas Interaction

Users can place the annotation anywhere on the image with a simple mouse click. Each click positions the annotation at the mouse cursor's location. Further clicks either remove an empty annotation or convert a non-empty annotation into a text (`<p>` tag), additionally prompting the user with a new text input field.

**Code Logic:**

With the text annotation mode enabled, a user's click on the canvas checks for any previously drawn text annotation. If one exists, we transform the previous annotation into a text (`<p>` tag). This transformation involves removing the `div` containing the input textarea and appending the `p` tag with the same attributes and styling as the textarea to the foreign object. We then create a new text annotation object, and new mouse trackers are added to listen for the user's click event to place the annotation on the image. The `onMouseClickToDraw` function in `viewer.js` handles these functionalities.

#### Text Input Interaction

Once the annotation is positioned, the user can interact with it in several ways:

1. **Text Entry**: Users can input their desired text into the text area.
2. **Annotation Movement**: Users can relocate the annotation across the canvas by clicking and dragging the text area borders.
3. **Text Box Resizing**: Users can adjust the horizontal dimensions of the text box by dragging the resize control.

**Code Logic:**

The `text.js` file contains all the functions that handle text interaction. For text entry, the textarea manages the input functionality. Event listeners on the input event adjust the textarea's height after each input change to accommodate the text as it shifts to a new line. The drag functionality, or annotation movement, is handled by the event handlers on the `mouseover` event of the `div` containing the textarea. The application performs basic arithmetic computation to accurately adjust the `div`'s position. The resize control handles the text box resizing, listening for the same event and adjusting the width of the `div` containing the textarea accordingly. These functionalities are elaborated in detail within the code comments.



### Export/Import of Text Annotations

#### Export Functionality
Given that we utilize a foreign object and HTML elements to facilitate the text annotation functionality, our export process differs from other annotations that use the `exportToSVG` function found in the `base.js` file. Instead, we directly return the `outerHTML` of the foreign object. This HTML string is then appended to the SVG annotation string used for export.

#### Import Functionality
In the import process, we need to load the foreign object into the SVG as a text annotation. This involves cloning the node of the foreign object and creating a new `<p>` tag that retains the same attributes as the imported foreign object. Instead of generating a new foreign object from scratch, we repurpose the imported one. Thanks to the DOM parser treating the ForeignObject as an SVG element, we can directly attach it to the SVG. As of the current version, we do not have an edit functionality for imported annotations.

### Additional Resources

For more details and context regarding the Text Annotation feature, please refer to the following GitHub links:

1. [OpenSeadragon Viewer Issue #102](https://github.com/informatics-isi-edu/openseadragon-viewer/issues/102)
2. [OpenSeadragon Viewer Issue #103](https://github.com/informatics-isi-edu/openseadragon-viewer/issues/103)
3. [OpenSeadragon Viewer Pull Request #105](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/105)

These links provide further discussions and insights into the design and implementation of the Text Annotation feature.



## Arrow Line Annotation

This section of the documentation details the Arrow Line Annotation functionality that has been added to the viewer application. This feature uses SVG line shapes to create arrow annotations, appending an arrowhead at the line's end using the `marker-end` attribute. The SVG marker definition for the arrowhead is added to the SVG definitions (`defs` tag) for the corresponding annotation SVG and is then referenced in the line's `marker-end` attribute.

### Core Changes

#### `arrowline.js`
This new file contains the functionality for the Arrow Line Annotation tool.

#### `base.js`
Modifications were made to handle the `marker-end` attribute, which is only applicable to the Arrow Line Annotation type. Furthermore, changes were made to support the exporting of the required arrowhead marker definitions.

#### `mview.html`
The `arrowline.js` script is now being loaded.

#### `annotation-svg.js`
This file now includes code for:
- Adding the marker definition to the annotation SVG.
- Changing the arrowhead's color upon stroke color change.
- Parsing saved arrow line annotations correctly and creating corresponding marker SVG definitions to match the stroke colors of the loaded arrow lines.

#### `annotation-group.js`
The Arrow Line Annotation type case has been added, handling the addition of marker definitions to the annotation group and managing the change of the arrowhead color upon drawing stroke color change.

#### `annotation-tool.js`
HTML code modifications were made to render the Arrow Line option in the tool, along with other case changes related to the Arrow Line Annotation.

### Notable Updates

Instead of the SVG element, the marker definition now gets added to the `g` (group) tag for each group. Marker definitions are exported and saved alongside the annotation SVG, allowing the SVGs to work with other viewers if needed. The saved annotations are loaded differently, and the SVG nodes are parsed in a new way.

The Arrow Line Annotation supports multiple arrowhead styles, but for now, only the solid arrow style is visible. The code for additional styles is included in the pull request, but these are currently disabled at the rendering level. The HTML code for these styles is commented out in `annotation-tool.js`.

### Fixes and Adjustments

To ensure unique marker IDs for the marker definitions, unique marker definitions are now created for Arrow Line Annotations. This change addressed an issue where SVG definitions were added to the same namespace as the document. 

A bug that resulted in the marker definition function getting called while saving the SVG was fixed. This was achieved by removing `marker-end` and `data-markerid` attributes from the default attribute list in the `base.js` file, which previously added the attributes to all annotations.

Lastly, the arrowhead marker definition was modified to reduce the dimensions of the arrowhead, ensuring a reasonable size when highlighted. This change involved adjusting the `d` values of the path SVG element in the marker head, as well as the marker dimensions and reference coordinates in the marker tag.

Thank you for providing the additional link. Here's the updated section:

### Additional Resources

For a more comprehensive understanding and deeper insights into the Arrow Line Annotation feature, kindly refer to the following GitHub links:

1. [OpenSeadragon Viewer Issue #92](https://github.com/informatics-isi-edu/openseadragon-viewer/issues/92)
2. [OpenSeadragon Viewer Pull Request #100](https://github.com/informatics-isi-edu/openseadragon-viewer/pull/100)

These links can provide further context and discussions that were crucial to the design and implementation of the Arrow Line Annotation feature.