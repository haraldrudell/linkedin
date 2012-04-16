// server.js
// provide an http based server
// similar function to what is provided by express, connect or other web framework

//http://nodejs.org/docs/latest/api/http.html
var http = require('http')
// http://nodejs.org/docs/latest/api/url.html
var url = require('url')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

var jsonhtml = require('./jsonhtml')

exports.server = server

function server(port, 
	completedUri, completedHandler,
	authenticateUri, authenticateHandler,
	logger, register) {
	if (!logger) logger = function () {}
	// start our web server that the user is redirected to after authentication
	var server = http.createServer(function(req, res) {
		var parsedUrl = url.parse(req.url, true)
		if (parsedUrl.pathname == completedUri) {
			completedHandler(parsedUrl.query, function(err, data) {
				if (err) {
					var string = err instanceof Object ?
						err.message || JSON.stringify(err) :
						err.toString()
					res.writeHead(500, {"Content-Type": "text/plain"})
					res.end(string)	
				} else {
					// api call successful rendering
					res.writeHead(200, {"Content-Type": "text/html"})
					res.end(jsonhtml.jsonHtml(data, authenticateUri, register))
				}
			})
		} else if (parsedUrl.pathname == authenticateUri) {
			authenticateHandler(function(err, url) {
				if (!err) {
					res.writeHead(302, {"Content-Type": "text/plain",
						'Location': url})
					res.end('Redirecting:' + url)
				} else {
					res.writeHead(500, {"Content-Type": "text/plain"})
					res.end(err.toString())
				}
				
			})
		} else if (parsedUrl.pathname == '/server.css') {
			console.log(parsedUrl.pathname)
			fs.readFile(__dirname + '/server.css', function(error, content) {
				if (!error) {
					res.writeHead(200, { 'Content-Type': 'text/css' })
					res.end(content)
				} else {
					res.writeHead(500)
					res.end()
				}
			})
		} else {
			logger('404 response for url:', parsedUrl.pathname)
			res.writeHead(404, {"Content-Type": "text/plain"})
			res.end('not found')	
		}
		}).listen(port)
	return server
}
