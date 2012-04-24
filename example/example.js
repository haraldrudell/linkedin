// example.js
// working LinkedIn rest api example

// imports
// the client code for this module that we should demonstrate
// https://github.com/haraldrudell/linkedin
var linkedin = require('../lib/linkedin')
var utils = require('./utils')

// the api call to display
LinkedInUri = '/people/~:(picture-url,first-name,last-name,headline)'

// get our configuration
var defaults = utils.getDefaults('linkedin.json')
var port = utils.getPort(defaults.hostUrl)

// launch our server so we can display things to the user
// and receive redirects from LinkedIn after authoriztion
var app = utils.createServer()
utils.handleHttp(app, defaults, completedHandler,
	authenticateHandler, console.log)
app.listen(port)

// prepare the local client code
var client = linkedin.getApiClient(defaults)

// apply access credentials that we stored for this user
// the credentials would have been obtained at a prior authorization
var obj = utils.readStore()
if (obj) client.applyAccessCredentials(obj)

// if we have credentials, immediately launch the browser to display the api call results
if (client.hasAccess()) utils.browseTo(defaults.authorize_callback)

// begin authorization flow with LinkedInotherwise, authorize the LinkedIn web app first
else client.authorize(function(err, url) {
	if (err) console.log('Error when retrieving request token from LinkedIn:', err)
	else 

		// we successfully obtained Oauth request tokens
		// display the authorization web page to the user
		// user will finally be redirected to completedUri by LinkedIn
		utils.browseTo(url)
})

// An authroization attempt has been completed
// capture access credentials
// display api-call results to user
function completedHandler(queryObject, callback) {

	// provide authroization results to local client code
	client.handleAuthorizing(queryObject, function(err, possibleAccessCredentials) {
		// some error trying to get access tokens
		if (err) callback(err, null)
		else {

			if (possibleAccessCredentials) {
				// we just successfully obtained Oauth access tokens, save them
				// typically they last forever
				utils.writeStore(possibleAccessCredentials)
			}

			// verify that our app is authorized
			if (!client.hasAccess()) {
				var json = ({ issue: 'You have not authorized this application' })
				callback(null, json)
			} else
				// execute the api call
				doApi(callback)
		}
	})
}

// we are authorized and want to display something fun!
function doApi(callback) {
	// send an api call to LinkedIn
	client.api(LinkedInUri, function(err, json) {
		// let server render whatever we got back
		callback(err, json)
	})
}

// the user clicked reauthenticate button on the completed page
// the browser is fetching our authentication url
function authenticateHandler(callback) {

	// clear possible exisiting credentials
	client.clearAccess()

	// have our client code re-initialize authentication
	// this will redirect to LinkedIn's authorization page
	// and eventually we will get a request for completedUri
	client.authorize(callback)
}
