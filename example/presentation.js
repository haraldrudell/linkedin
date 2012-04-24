// presentation.js
// handle interface between server's html and app's json

// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

var jsonhtml = require('./jsonhtml')

exports.handleHttp = handleHttp

function handleHttp(app, defaults, completedHandler, authenticateHandler, logger) {
	if (!logger) logger = function () {}
	else if (app.setLogger) app.setLogger(logger)

	console.log('server at:', defaults.hostUrl)

	app.get(defaults.authenticateUri, function(req, res) {
		authenticateHandler(function(err, url) {
			render(err, 'Redirecting:' + url, res, url)
		})
	})

	app.get(defaults.completedUri, function (req, res) {
		completedHandler(req.param, function(err, data) {
			if (!err) {
				// we have object-format results that should be presented as html
				data = jsonhtml.jsonHtml(data, defaults.authenticateUri, defaults.register)
			}
			render(err, data, res)
		})
	})

	// render text response and proper status code 200, 302, 500
	function render(err, data, res, redirectUrl) {
		var isHtml = false
		var statusCode = 200
		var headers = {}

		if (!err) {
			if (redirectUrl) {
				statusCode = 302
				headers['Location'] = redirectUrl
			}
			if (typeof data != 'string') throw Error('Response not string')
			isHtml = data[0] == '<'
		} else {
			statusCode = 500
			data = err instanceof Object ?
				err.message || JSON.stringify(err) :
				err.toString()
		}
		headers['Content-Type'] = isHtml ? "text/html" : "text/plain"
		res.writeHead(statusCode, headers)
		res.end(data)
	}

}
