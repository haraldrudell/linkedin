// optsutils
// some useful functions for the LinkedIn api client
exports.verifyTextFields = verifyTextFields
exports.applyDefaults = applyDefaults

// return value true: credentials are present
// otherwise an array of offending fields 
function verifyTextFields(opts, fieldNames) {
	var result

	// verify that we have an object
	if (opts == null || opts.constructor != Object) {
		// bad object: all fields are missing
		result = fieldNames
	}

	// verify that each key holds a non-empty string
	if (!result) {
		result = []
		fieldNames.forEach(function(fieldName) {
			if (!fieldIsValid(fieldName)) {
				// this field was bad, save it
				result.push(fieldName)
			}
		})
		// if no bad fields, indicate success
		if (result.length == 0) result = true
	}

	return result

	function fieldIsValid(key) {
		var value = opts[key]
		var result = typeof value == 'string' &&
			value.length > 0
		return result
	}

}

function applyDefaults(opts, defaults) {

	// to avoid modifying the original object, copy it
	var result = {}
	if (opts != null || typeof opts == 'object') {
		for (var property in opts) {
			result[property] = opts[property]
		}
	}

	// apply defaults
	for (var property in defaults) {
		if (result[property] == null) {
			result[property] = defaults[property]
		}
	}

	return result

}
