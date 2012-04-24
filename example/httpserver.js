// httpserver.js
// provide an http server based on the built-in http module with connect-like features

//http://nodejs.org/docs/latest/api/http.html
var http = require('http')
// http://nodejs.org/docs/latest/api/url.html
var url = require('url')
exports.createServer = createServer

function createServer() {
	var logger = function () {}
	var handlers = {}

	var instance = http.createServer(listener)
	instance.get = get
	instance.setLogger = setLogger
	return instance

	// incoming message from the socket we listen to
	// req: http.serverRequest constructor http.IncomingMessage
	// res http.ServerResponse
	// express handlers are (req, res, next)
	function listener(req, res) {
		var parsedUrl = url.parse(req.url, true)
		req.param = parsedUrl.query
		var handler = handlers[parsedUrl.pathname] || renderNotFound
		handler(req, res, renderNotFound)

		function renderNotFound() {
			var statusCode = 404
			var text = http.STATUS_CODES[statusCode]
			logger(text + ': ', parsedUrl.pathname)
			res.writeHead(statusCode, {"Content-Type": "text/plain"})
			res.end(text)
		}

	}

	// implement express: app.get
	function get(uri, handler) {
		handlers[uri] = handler
	}

	function setLogger(log) {
		logger = log
	}

}
