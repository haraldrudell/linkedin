// utils.js
// interface file system and browser

//imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/docs/latest/api/url.html
var url = require('url')
var optsutils = require('../lib/optsutils')
// http://nodejs.org/docs/latest/api/child_process.html
var spawn = require('child_process').spawn
var credentialstore = require('./credentialstore')

// for re-export
var httpserver = require('./httpserver')
var presentation = require('./presentation')

// exports
exports.browseTo = browseTo
exports.getPort = getPort
exports.readStore = credentialstore.readStore
exports.writeStore = credentialstore.writeStore
exports.getDefaults = getDefaults
exports.getHomeFolder = getHomeFolder
exports.createServer = httpserver.createServer
exports.handleHttp = presentation.handleHttp

var fields = [ "consumerKey", "consumerSecret",
	"hostUrl", "authenticateUri", "completedUri"
 ]

// display the web destination url to the user
function browseTo(url) {
	var cmd =
		process.platform == 'win32' ? 'explorer.exe' :
		process.platform == 'darwin' ? 'open' :
		'xdg-open'

	//console.log('spawn', cmd, [url])
	spawn(cmd, [url])
}

function loadParameters(filename, fields) {
	var defaults = false

	// read environment file with defaults
	try {
		defaults = JSON.parse(fs.readFileSync(filename))
	} catch (e) {
		var bad = true

		// ignore file not found
		if (e instanceof Error  && e.code == 'ENOENT') bad = false

		if (bad) throw(e)
	}

	if (defaults) {
		if (!defaults.authorize_callback) {
			defaults['authorize_callback'] = defaults.hostUrl + defaults.completedUri
		}
		// verify required parameters present
		var badFields = optsutils.verifyTextFields(defaults, fields)
		if (badFields !== true) {
			throw Error('Parameter file \'' + environmentFile +
				'\' is missing fields:' + badFields.join(','))
		}

		// set go register flag
		var apiKey = defaults.consumerKey
		if (apiKey.indexOf(' ') != -1) {
			defaults.register = true
			defaults.consumerKey = defaults.deleteMe
			defaults.consumerSecret = defaults.deleteMe2
		}
	}

	return defaults
}

function getPort(hostUrl) {
	var port

	// check for specific port number
	if (hostUrl != null && typeof hostUrl == 'string') {
		var urlObject = url.parse(hostUrl, false, true)

		// port number given
		if (urlObject.port) {
			var num = parseInt(urlObject.port)
			if (!isNaN(num)) port = num
		}

		// https default port
		if (!port && urlObject.protocol &&
			urlObject.protocol == 'https:') {
			port = 443
		}
	}

	// default port
	if (!port) port = 80

	return port
}

function getDefaults(filename, folders) {
	var result = false

	if (!folders) folders = [ getHomeFolder(), __dirname + '/..' ]

	// look in all provided folders
	if (Array.isArray(folders)) {
		folders.every(function(folder) {
			var value = load(filename, folder)
			if (value) {
				result = value
			}
			return !result
		})
	} else {
		result = load(filename, folder)
	}

	if (!result) throw Error('Problem finding the file ' + filename)

	return result

	function load(filename, folder) {
		var path = folder ?
			folder + '/' + filename :
			filename
		return loadParameters(path, fields)
	}

}

function getHomeFolder() {
	return process.env[
		process.platform == 'win32' ?
		'USERPROFILE' :
		'HOME'];
}
