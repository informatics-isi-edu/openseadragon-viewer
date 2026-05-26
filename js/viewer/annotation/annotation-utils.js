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
	// Trim only the outer string and split into declarations; whitespace *within*
	// a value (e.g. `transform-origin: 0px 0px`) must be preserved or the browser
	// rejects the value and falls back to the default.
	styleString = (styleString || '').trim();
	if (styleString.endsWith(';')) {
		styleString = styleString.slice(0, -1);
	}

	var styleObject = {};
	var declarations = styleString.split(';');

	for (var i = 0; i < declarations.length; i++) {
		var idx = declarations[i].indexOf(':');
		if (idx === -1) continue;
		var property = declarations[i].slice(0, idx).trim();
		var value = declarations[i].slice(idx + 1).trim();
		if (property && value) {
			styleObject[property] = value;
		}
	}

	return styleObject;
}
