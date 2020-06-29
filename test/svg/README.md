# SVG File description

Make sure that the viewbox attribute of the file is set properly so that it aligns with the image that it is being tested on.

- styleWithSpace.svg
This svg file contains the style tag having spaces. Place the file path in the URL to test if it is being handled properly or not.

- cascadingProperties.svg
This svg file contains a group <g> in which style is defined. The group contains 2 <circle> inside it. The first circle inherits the 'opacity' property from the parent, i.e. the group, while the second circle which already contains the 'opacity' property does not get affected.

- noViewbox.svg
This file contains an SVG which does not have a viewBox. When such an svg is used, it won't be displayed and for now will give a <console.log()> error.
