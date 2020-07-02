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