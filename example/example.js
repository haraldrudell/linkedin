// example.js
// working LinkedIn rest api example

// imports
var linkedin = require('../lib/linkedin')
var utils = require('./utils')
var server = require('./server')

// the api call to display
LinkedInUri = '/people/~:(picture-url,first-name,last-name,headline)'

// get our configuration
linkedinJson = 'linkedin.json'
var defaults = utils.getDefaults(linkedinJson, [ utils.getHomeFolder(), __dirname + '/..' ])
if (!defaults) throw(Error('Problem finding the file ' + linkedinJson))
var port = utils.getPort(defaults.hostUrl)

// launch our server so we can display things to the user
// and receive redirects from LinkedIn after authoriztion
console.log('starting server:', defaults.hostUrl)
var aServer = server.server(port,
	defaults.completedUri, completedHandler,
	defaults.authenticateUri, authenticateHandler,
	console.log, defaults.register)

// authorize the web application for the user
var client = linkedin.getApiClient(defaults)

// here you could apply previously obtained credential for this user
var obj = utils.readStore()
if (obj) client.applyAccessCredentials(obj)

// if we have credentials, use the api
if (client.hasAccess()) {
	// display our server to the user
	utils.browseTo(defaults.authorize_callback)
}

// otherwise, authorize the LinkedIn web app first
client.authorize(function(err, url) {
	if (err) console.log('Error when retrieving request token from LinkedIn:', err)
	else {
		// we successfully obtained Oauth request tokens

		// display the authorization web page to the user
		utils.browseTo(url)

		// user will be redirected to completedUri by LinkedIn
	}
})

// invoked by server when our url is requested, server extects json
// for requests to the redirect after authorizing, process and obtain Oauth access token
function completedHandler(queryObject, callback) {
	// for requests to the redirect after authorizing, process and obtain Oauth access token
	client.handleAuthorizing(queryObject, function(err, possibleAccessCredentials) {
		// some error trying to get access tokens
		if (err) callback(err, null)

		if (possibleAccessCredentials) {
			// we just successfully obtained Oauth access tokens, save them
			// typically they last forever
			utils.writeStore(possibleAccessCredentials)
		}

		// render some final data to the user
		if (!client.hasAccess()) {
			var json = ({ issue: 'You have not authorized this application' })
			callback(null, json)
		} else doApi(callback)
	})
}

// we are authorized and want to display something in json format
function doApi(callback) {
	// send an api call to LinkedIn
	client.api(LinkedInUri, function(err, json) {
		// let server render whatever we got back
		callback(err, json)
	})
}

function authenticateHandler(callback) {
	client.clearAccess()
	client.authorize(callback)
}
