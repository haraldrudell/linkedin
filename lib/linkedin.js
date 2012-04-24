// linkedin.js
// LinkedIn api client interfacing the rest api

// https://github.com/ciaranj/node-oauth
var OAuth = require('oauth').OAuth
var optsutils = require('./optsutils')

exports.getApiClient = getApiClient

var linkedinBaseUrl = 'http://api.linkedin.com/v1'

var oauth_problem = 'oauth_problem'

var consumerCredentials = [ 'consumerKey', 'consumerSecret', 'authorize_callback' ]
// TODO insert access credentials field names
var accessCredentials = [ 'oauth_access_token', 'oauth_access_token_secret' ]
// authorization results from LinkedIn
var authorizationCredentials = [ 'oauth_token', 'oauth_verifier' ]

// data provided to the oauth module
var oauthParameters = {
	//
	requestUrl: 'https://api.linkedin.com/uas/oauth/requestToken',
	// 
	accessUrl: 'https://api.linkedin.com/uas/oauth/accessToken',
	// consumerKey is provided when registering with the OAuth provider
	// LinkedIn name: API Key
	//consumerKey: '',
	// consumerSecret is provided when registering with the OAuth provider
	// LinkedIn name: Secret Key
	//consumerSecret: '',
	// OAuth version
	version: '1.0',
	// OAuth Callback URL
	// authorize_callback: or oob (pin code experience)
	//authorize_callback: 'http://',
	// signatureMethod: PLAINTEXT or HMAC-SHA1
	signatureMethod: 'HMAC-SHA1',
	// nonceSize: default 32
	nonceSize: undefined,
	// customHeaders: optional
	customHeaders: {
		"Accept" : "*/*",
		"Connection" : "close",
		"User-Agent" : "linkedin node.js module",
		'x-li-format': 'json'
	}
}

function getApiClient(opts) {
	var result = false

	if (optsutils.verifyTextFields(opts, consumerCredentials) === true) {
		opts = optsutils.applyDefaults(opts, oauthParameters)
		var oauthclient = new OAuth(opts.requestUrl,
				opts.accessUrl,
				opts.consumerKey,
				opts.consumerSecret,
				opts.version,
				opts.authorize_callback,
				opts.signatureMethod,
				opts.nonceSize,
				opts.customHeaders)
		result = {
			oauth: oauthclient,
			hasAccess: hasAccess,
			getAccessCredentials: getAccessCredentials,
			applyAccessCredentials: applyAccessCredentials,
			api: api,
			authorize: authorize,
			handleAuthorizing: handleAuthorizing,
			clearAccess: clearAccess
		}
	}

	return result
}

// start authorizing: obtain request token and provide the url to display to the user
function authorize(callback) {
	var self = this
	this.oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
		if (error) callback(error)
		else {
			if (!oauth_token ||
				!oauth_token_secret ||
				!results ||
				!results.xoauth_request_auth_url) {
				callback(Error('inadequate OAuth request token reponse from LinkedIn'))
			} else {
				var authorizeUrl = results.xoauth_request_auth_url + 
					'?oauth_token=' + oauth_token
				self.oauth_token_secret = oauth_token_secret
				callback(null, authorizeUrl)
			}
		}
	})
}

// true: client has access credentials
function hasAccess() {
	return !!this.access
}

function handleAuthorizing(queryParams, callback) {
	var result = false
	var err
	if (!this.hasOwnProperty('oauth_token_secret')) {
		// we are not waiting for authorization
		callback(err, result)
	} else {

		// consume this authorization attempt
		var oauth_token_secret = this.oauth_token_secret
		delete this.oauth_token_secret

		// verify that query parameters are present
		// ?oauth_token=969a0540-9f41-457c-8a27-6b6740a4f5cb&oauth_verifier=82949
		var fields = optsutils.verifyTextFields(queryParams, authorizationCredentials)
		if (fields !== true) {
			// we are missing query parameters

			var userRejected = queryParams.hasOwnProperty(oauth_problem)

			if (!userRejected) {
				err = Error('Missing parameters from LinkedIn:' + fields.join(','))
			}
			callback(err, result)
		} else {

			var self = this

			this.oauth.getOAuthAccessToken(
				queryParams.oauth_token,
				oauth_token_secret,
				queryParams.oauth_verifier,
				function(error, oauth_access_token, oauth_access_token_secret, results) {
					if (!error) {
						var access = {
							oauth_access_token: oauth_access_token,
							oauth_access_token_secret: oauth_access_token_secret,
						}
						var ok = self.applyAccessCredentials(access)
						if (ok !== true) {
							error = Error('Bad access token fields from LinkedIn:')
						} else {
							result = access
						}
					}
					callback(error, result)
				})
		}
	}

}

// return value: credentials or false if none available
function getAccessCredentials() {
	var result = false

	if (this.hasAccess()) {
		result = {
			oauth_access_token: this.access.oauth_access_token,
			oauth_access_token_secret: this.access.oauth_access_token_secret,
		}
	}

	return result
}

// store access credentials in our client
// stored as this.access = {}
// return value: true if access credentials was applied
function applyAccessCredentials(obj) {
	var result = false

	var self = this
	if (optsutils.verifyTextFields(obj, accessCredentials) === true) {
		this.access = {
			oauth_access_token: obj.oauth_access_token,
			oauth_access_token_secret: obj.oauth_access_token_secret,
		}
		result = true
	}

	return result
}

function api(uri, callback) {
	// url, method, oauth_token, oauth_token_secret, callback
	this.oauth.getProtectedResource(
		linkedinBaseUrl + uri,
		'GET',
		this.oauth_access_token,
		this.oauth_access_token_secret,
		function (error, data, response) {
			// response is a response object
			var result = null
			if (!error) {
				result = JSON.parse(data) ||
					{ Issue: 'LinkedIn did not repond with json' }
			}
			callback(error, result)
	})
}

function clearAccess() {
	delete this.access
	delete this.oauth_token_secret
}

// retrieve all results for a paged request
// query: keys:
// - url the search url that can have &start and &count appended to it
// - filter: an optional filter with key: fieldname, value: required value
// - stream: true if you want one callback(err, data) for each non-null value
// -- last callback has either err non-null or data null
// -- if calback returns false, the api call is terminated
function pagedSearch(query, callback) {
	var self = this
	var result = query.stream ? null : []
	var c = {

		// fetch control
		// concurrent requests
		max: 5,
		// key: first item requested, value: don't care
		pending: {},
		pageSize: 25,
		nextToFetch: 0,
		maxToFetch: -1,
		// key: first item, value: results array
		received: {},

		// processing control
		nextToProcess: 0,

		cancelled: false,
	}

	fetch()

	// sample responses
	// {"numResults":336209,
	// 	"people":
	//	{"_count":1,"_start":0,"_total":100,"values":[{"connections":{"_total":403},"distance":1,"firstName":"Jonathan (Sian)","id":"NBMgM6TPyf","lastName":"Liu"}]}}
	//
	// { numResults: 336217, people: { _start: 100, _total: 100 } }


	function fetch() {
		if (!c.cancelled) {
			if (c.maxToFetch == -1 || c.nextToFetch < c.maxToFetch) {
				var myFirst = c.nextToFetch
				c.nextToFetch += c.pageSize
				var url = query.uri + '&start=' + myFirst + '&count=' + c.pageSize
				c.pending[myFirst] = true
				self.api(url, function(err, json) {
					delete c.pending[myFirst]
					if (err) {
						c.cancelled = true
						callback(err, json)
					} else if (!c.cancelled) {
						// did we get people object?
						if (json && json.people) {

							// update max
							if (c.maxToFetch == -1) {
								var total = json.people._total
								if (total) c.maxToFetch = total
							}

							// ensure we got a full page
							var count = 0
							var values = json.people.values
							if (Array.isArray(values)) count = values.length
							if (count < c.pageSize && // we did not get a full page
								myFirst + count < c.maxToFetch) { // and not at end
								var err = Error('didnotgetfullpage:' + myFirst + ',' +
									count + ',' +
									JSON.stringify(json))
								c.cancelled = true
								callback(err, json)
							}

							if (count > 0) {
								// we know there is one pending slot available
								fetch()

								// forward to process
								c.received[myFirst] = values
								if (c.nextToProcess == myFirst) process()
							}

							// there will be at least one request
							// we either got an error or get here
							if (Object.keys(c.pending).length == 0) {
								// this is the response from the last request

								// if there was no data, go complete
								if (c.maxToFetch == -1) {
									// we never got a total
									var err = Error('got no total:' + myFirst +
										JSON.stringify(json))
									c.cancelled = true
									callback(err, json)
								} else if (c.maxToFetch == 0) {
									// there was no data at all
									complete()
								}
							}

						} else {
							var err = Error('didnotgetpeople:' + myFirst +
								JSON.stringify(json))
							c.cancelled = true
							callback(err, json)
						}
					}
				})
				// after submitting a request, submit another one to capacity
				if (Object.keys(c.pending).length < c.max) fetch()
			}
		}
	} // submit

	// the next data to process is available
	function process() {
		while (!c.cancelled) {
			// get the data
			var myFirst = c.nextToProcess
			var values = c.received[myFirst]
			if (!values) break

			// process the items
			values.every(function(value) {
				if (matchWithFilter(query.filter, value)) {
					if (query.stream) {
						if (!callback(null, value)) {
							c.cancelled = true
						}
					} else {
						result.push(value)
					}
				}
				return !c.cancelled
			})

			// drop the data
			delete c.received[myFirst]
			c.nextToProcess += values.length
		}
		if (!c.cancelled &&
			c.maxToFetch != -1 &&
			c.nextToProcess == c.maxToFetch) {
			complete()
		}
	}

	function complete() {
		callback(null, result)
	}
	
}
