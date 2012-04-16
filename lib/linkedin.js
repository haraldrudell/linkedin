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
			}
			var authorizeUrl = results.xoauth_request_auth_url + 
				'?oauth_token=' + oauth_token
			self.oauth_token_secret = oauth_token_secret
			callback(null, authorizeUrl)
		}
	})
}

function hasAccess() {
	return optsutils.verifyTextFields(this, accessCredentials) === true
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
						var fields = optsutils.verifyTextFields({
							oauth_access_token: oauth_access_token,
							oauth_access_token_secret: oauth_access_token_secret,
						}, accessCredentials)
						if (fields !== true) {
							error = Error('Missing access token fields from LinkedIn:' +
								fields.join(','))
						} else {
							self.oauth_access_token = oauth_access_token
							self.oauth_access_token_secret = oauth_access_token_secret
							result = self.getAccessCredentials()
						}
					}
					callback(error, result)
				})
		}
	}

}

function getAccessCredentials() {
	var result = false

	if (this.hasAccess()) {
		result = {}
		var self = this
		accessCredentials.forEach(function(property) {
			result[property] = self[property]
		})
	}

	return result
}

function applyAccessCredentials(obj) {
	var result = false

	if (optsutils.verifyTextFields(obj, accessCredentials) === true) {
		accessCredentials.forEach(function(property) {
			this[property] = obj[property]
		})		
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
	var self = this
	accessCredentials.forEach(function(property) {
		delete self[property]
	})
	delete this.oauth_token_secret
}
