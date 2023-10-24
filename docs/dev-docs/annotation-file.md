# Expected SVG format

In this document, we will go over what the output SVG for each drawing tool looks like. This can be useful when you're generating the SVG yourself.

- [Overal structure](#overal-structure)
- [Drawings](#drawings)
  - [Path](#path)
  - [Rectangle](#rectangle)
  - [Line](#line)
  - [Arrow line](#arrow-line)
  - [Polygon](#polygon)
  - [Text](#text)


## Overal structure

We expect drawings to be grouped together with an `id` attribute. The `id` value is used to map the drawing to a vocabulary term in the database. We also accept the `name` attribute for this, but it will be changed to `id` when you save it. So it's recommended that you stick with `id` attribute.

We expect the `id` value to include both the `Name` and `ID` of the vocabulary term in the `<ID>,<Name>` format. For example `<g id="EMAPA:35126,ankle joint">`.

```html
<svg viewBox="0 0 <IMAGE_WIDTH> <IMAGE_HEIGHT>" xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink">
  <scale x="1" y="1" />
  <g id="<ANATOMY_NAME_AND_ID>">
    DRAWINGS
  </g>
</svg>


example:
<svg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'
  xmlns:xlink='http://www.w3.org/1999/xlink'>
  <scale x='1' y='1' />
  <g id='EMAPA:35126,ankle joint'>
    <circle cx="223.0991430260047" cy="138.40684101654847" fill="None" r="48.989762789621246"
      stroke="#d5ff00"></circle>
    <rect fill="None" height="84.97798463356975" stroke="#d5ff00" width="81.99187352245866"
      x="306.46099290780137" y="203.29890661938532"></rect>
    <line fill="None" stroke="#d5ff00" x1="456.77829491725765" x2="555.8282358156029"
      y1="121.24453309692672" y2="227.98736702127655"></line>
  </g>
</svg>

```

## Drawings

In this section, we will mention what each drawing looks like. In the current implementation, all the drawings within a group must use the same `stroke` color. Ensure this property is added to all drawings and has the same value.

### Path

```html
<path d="<THE_PATH_DEFINITION>" fill="None" stroke="<COLOR_VALUE>" />

example:
<path
      d="M137.41409574468082,89.94753989361698L137.41409574468082,90.2039228723404L137.41409574468082,90.46030585106382L137.144414893617,90.99963430851062L137.144414893617"
      fill="None" stroke="#d5ff00"></path>
```

- The `d` attribute is how you define the path. Refer to [this page](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path) for more information.
- `fill="None"` and `stroke` will ensure displaying proper color. As we mentioned before, this value must be consistent with all the other drawings in this group.

### Rectangle

```html
<rect fill="None" stroke="<COLOR_VALUE>" height="<HEIGHT>" width="<WIDTH>" x="<X_VALUE>" y="<Y_VALUE>"></rect>

example:
<rect fill="None" stroke="#d5ff00" height="84.97798463356975" width="81.99187352245866"
      x="306.46099290780137" y="203.29890661938532"></rect>
```

- The `x`, `y`, `width`, and `height` are required for drawing the rectangle. Refer to [this page](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect) for more information.
- `fill="None"` and `stroke` will ensure displaying proper color. As we mentioned before, this value must be consistent with all the other drawings in this group.

### Line

```html
<line fill="None" stroke="<COLOR_VALUE>" x1="<STARTING_X_VALUE>" x2="<END_X_VALUE>"
      y1="<STARTING_Y_VALUE>" y2="<END_Y_VALUE>"></line>

example:
<line fill="None" stroke="#d5ff00" x1="456.77829491725765" x2="555.8282358156029"
      y1="121.24453309692672" y2="227.98736702127655"></line>
```
- The `x1`, `x2`, `y1`, and `y2` are required for drawing the line. Refer to [this page](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line) for more information.
- `fill="None"` and `stroke` will ensure displaying proper color. As we mentioned before, this value must be consistent with all the other drawings in this group.

### Arrow line

```html
<defs>
  <marker id="<UNIQUE_ID>" markerUnits="strokeWidth" markerWidth="7"
    markerHeight="7" orient="auto" refX="2.5" refY="2.5" data-subtype="solid">
    <path fill="#d5ff00" d="M 0 0 L 5 2.5 L 0 5 z"></path>
  </marker>
</defs>
<line data-markerid="<UNIQUE_ID>" marker-end="url(#<UNIQUE_ID>)" data-subtype="solid"
  fill="None" stroke="<COLOR_VALUE>" x1="<STARTING_X_VALUE>" x2="<END_X_VALUE>" y1="<STARTING_Y_VALUE>" y2="<END_Y_VALUE>"></line>

example:
<defs>
  <marker id="arrowmarker-d5ff0014017531" markerUnits="strokeWidth" markerWidth="7"
    markerHeight="7" orient="auto" refX="2.5" refY="2.5" data-subtype="solid">
    <path fill="#d5ff00" d="M 0 0 L 5 2.5 L 0 5 z"></path>
  </marker>
</defs>
<line data-markerid="arrowmarker-d5ff0014017531" marker-end="url(#arrowmarker-d5ff0014017531)" data-subtype="solid"
  fill="None" stroke="#d5ff00" x1="641.8054078014184" x2="638.0111554373523" y1="219.37499999999994" y2="315.3996010638298"></line>
```
- The `x1`, `x2`, `y1`, and `y2` are required for drawing the line. Refer to [this page](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line) for more information.
- The `marker` definition is how you create the arrowhead.
  - We recommend defining the arrowhead exactly like we mentioned. This will ensure that it shows the same arrowhead as our tools. You should just specify an `id`. The `id` attribute must be unique throughout the page.
- `data-markerid` value should be the same as the `id` you've chosen for the `marker`. `marker-end` should also refer to the same `id`.
- `data-subtype="solid"` is used internally to signal which type of arrowhead this is.
- `fill="None"` and `stroke` will ensure displaying proper color. As we mentioned before, this value must be consistent with all the other drawings in this group.


### Polygon

```html
<polygon fill="None" stroke="<COLOR_VALUE>" points="<EDGE_POINT_X_AND_Y_COMBO>"
      ></polygon>

example:
<polygon fill="None" stroke="#d5ff00" points="130.1237071513002,431.6493794326241 251.90115248226948,391.31567671394794 231.10121158392434,447.7095153664302"></polygon>
```
- The `points` are required for drawing the polygon. Refer to [this page](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polygon) for more information.
- `fill="None"` and `stroke` will ensure displaying proper color. As we mentioned before, this value must be consistent with all the other drawings in this group.


### Text

Since we wanted to ensure we're fully honoring the spacing, we're not using the SVG's `text` element but instead `foreignObject` with a `p` tag inside it. The following is an example of it:


```html
<foreignObject stroke="<COLOR_VALUE>" width="<WIDTH_OF_THE_BOX_CONTAINING_TEXT>" height="<HEIGHT_OF_THE_BOX_CONTAINING_TEXT>"
  class="text-foreign-object" x="<X_FOR_TOP_LEFT_CORNER_OF_TEXT>" y="<Y_FOR_TOP_LEFT_CORNER_OF_TEXT>">
  <p
    style="overflow-wrap: anywhere; white-space: pre-wrap;height: fit-content; width: fit-content; font-size: <FONT_SIZE>; color: <COLOR_VALUE>">
    <TEXT_VALUE>
  </p>
</foreignObject>

example:
<foreignObject stroke="#d5ff00" width="580px" height="374px"
  class="text-foreign-object" x="4663" y="5973">
  <p
    style="overflow-wrap: anywhere; white-space: pre-wrap;height: fit-content; width: fit-content; font-size: 259.67px; color: #d5ff00;">
    Test
  </p>
</foreignObject>
```

- Ensure you've specified the `width`, `height`, `x`, and `y` of the `foreignObject`.
- The `stroke` value on the `foreignObject` must be similar to the `color` that is added to the `p` tag.
  - `color` will ensure displaying proper color.
  - As we mentioned before, the `stroke` value must be consistent with all the other drawings in this group.
- The `font-size` must be defined on the `p` tag.
- Other styles on the `p` tag are not needed for openseadragon-viewer as we're going to override and inject those values. But for consistency it's better if you include them in your SVG.

