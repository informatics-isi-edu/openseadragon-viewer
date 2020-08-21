# SVG File description

Make sure that the viewbox attribute of the file is set properly so that it aligns with the image that it is being tested on.

- styleWithSpace.svg
This svg file contains the style tag having spaces. Place the file path in the URL to test if it is being handled properly or not.

- cascadingProperties.svg
This svg file contains a group <g> in which style is defined. The group contains 2 <circle> inside it. The first circle inherits the 'opacity' property from the parent, i.e. the group, while the second circle which already contains the 'opacity' property does not get affected.

- noViewbox.svg
This file contains an SVG which does not have a viewBox. When such an svg is used, it won't be displayed and for now will give a <console.log()> error.

- getNodeIdVariations.svg
This file contains 4 node, one for each of the possible case to assign an <ID> to the node in the SVG. The 4 cases are:
	1. The node has an ID
	2. the node has a Name, but not an ID
	3. The parent of the node has an ID, but the node itself has neither ID nor Name
	4. None of the above

- threeViewboxAttributes.svg
This svg contains a viewbox having 3 values only, instead of the normal four whcih are required. Since the viewbox is not according to the SVG standards, this files will not be displayed and give a <console.log()> error.

- heightWidthNoViewbox.svg
This file does not contain a viewBox attribute, but has a height and width. The height and width are used to create a viewbox in this case and the file is displayed according the those values.

- viewBoxAssignmentCheck.svg
This file does not contain a viewbox attribute. This testcase is an extension of heightWidthNoViewbox.svg, as not only it checks that the viewBox is created properly but also makes sure that the file is aligned properly with the image. In this case the rectangle should cover the outer boundary of the image.

- vectorEffectFixedPosition.svg
This file has the value of `vector-effect` as fixed-position, which is not the accepted value. So our code changes this value while display the SVG, but returns the original value while generating the output. image: 16-DJSY

- ignoredAttributes.svg
This file has an attribute that is not handled by us, i.e. `opacity`. So our code just ignores it but keeps it in the output svg. The SVG that is display is a fully visible square, i.e. not affected by opacity. image: 16-DJSY