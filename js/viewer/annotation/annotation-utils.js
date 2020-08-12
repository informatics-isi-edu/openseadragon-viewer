function AnnotationUtils() {};

/**
 * Will return a string of the style object, opposite of styleStringToObject function
 * @param {object} styleObject
 * @return {string}
 */
AnnotationUtils.prototype.styleObjectToString = function (styleObject) {
	styleObject = styleObject || {};
	var styleString = '';

	for (let key in styleObject) {
		styleString += key.toString() + ':' + styleObject[key].toString() + ';';
	}

	// remove the last ';'
	styleString = styleString.slice(0, styleString.length - 1);

	return styleString;
}

/**
 * Will return an object of the style string
 * @param {string} styleString
 * @return {object} the returned object is a key (eg style property like 'font-size') and value (eg '20px') pair
 */
AnnotationUtils.prototype.styleStringToObject = function (styleString) {
	styleString = styleString || '';
	styleString = styleString.replace(/\s/g, '');
	if (styleString[styleString.length - 1] == ';') {
		styleString = styleString.slice(0, styleString.length - 1);
	}

	var styleObject = {};

	styleString = styleString.split(';');

	for (i = 0; i < styleString.length; i++) {
		var property, value;
		[property, value] = styleString[i].split(':')
		if (value) {
			styleObject[property] = value;
		}
	}

	return styleObject;
}
