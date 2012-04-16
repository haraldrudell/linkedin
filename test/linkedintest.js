// linkedintest.js
// nodeunit test for linkedin.js
// https://github.com/caolan/nodeunit
// http://nodejs.org/docs/latest/api/all.html

var linkedin = require('../lib/linkedin')

exports.testLinkedIn = testLinkedIn

function testLinkedIn(test) {

	// can only instantiate client if required fields present
	var client = linkedin.getApiClient(null)
	test.equal(client, false, 'Could instantiate with missing parameters')

	// an instantiated client does not have access credentials
	var opts = {
		consumerKey: '1',
		consumerSecret: '2',
		authorize_callback: '3',
	}
	var arg = deepCopy(opts)
	var client = linkedin.getApiClient(arg)
	test.deepEqual(opts, arg, 'Illegal: getApiClient modified the argument')
	//console.log(client)
	test.ok(client, 'getAPiClient failed to return a client object')
	var hasAccess = client.hasAccess()
	test.equal(hasAccess, false, 'getApiClient.hasAccess failed')

	// TODO: test getAccessCredentials
	// TODO: test applyAccessCredentials
	// TODO: test api
	// TODO: test autorize

	test.done()
}

function deepCopy(object) {
	var result
	if (object == null || typeof object != 'object') {
		// primitive type: does not have reference
		result = object
	} else {
		// deep copy the object
		result = {}
		for (var property in object) {
			var value = object[property]

			// perform deep copy of all fields that are objects
			if (value != null && typeof value == 'object') value = deepCopy(value)

			result[property] = value
		}
	}
	return result
}
