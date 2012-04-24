// htmljson.js
// translate a json object to an html document

//imports
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

// exports
exports.jsonHtml = jsonHtml

// wrap body in html, insert title
function html(body, title) {
	return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>' +
		(title || 'LinkedIn client demo') +
		'</title><style type="text/css">' + css() + '</style></head><body>\n' +
		body +  
		'\n</body></html>'
}

function css() {
	return fs.readFileSync(__dirname +  '/server.css')
}

// convert object data to an html document string
function jsonHtml(data, authenticateUri, register) {

	// re-authenticate call to action
	var myHtml = '<div><button onclick="parent.location=\''+
	authenticateUri +'\'">Authenticate Again</button>'

	// register API key call to action
	if (register) {
		myHtml += '<br/>Get your own API Key at <a href=https://www.linkedin.com/secure/developer >https://www.linkedin.com/secure/developer</a>'
	}

	// LinkedIn profile headline
	if (data.headline) {
		myHtml += '<h1>' +data.headline + '</h1>'
	}

	// LinkedIn profile picture
	if (data.pictureUrl) {
		myHtml += '<img alt="Profile Picture" src=' +data.pictureUrl + ' />'
	}

	// LinkedIn profile full name
	var fullName = getName(data)
	if (fullName) myHtml += '<p>' + fullName + '</p>'
	myHtml += '</div>'

	// LinkedIn response field-by-field
	myHtml += allFields(data)
	
	return html(myHtml, fullName)
}

// get full name from LinkedIn profile response
function getName(data) {
	var fullName

	if (data.firstName || data.lastName) {
		fullName =
			data.firstName +
			(data.firstName && data.lastName ? ' ' : '') +
			data.lastName
	}
	
	return fullName
}

// provide verbose LinkedIn response
function allFields(data) {
	var count = 0
	var result = '<ol>'
	for (var property in data) {
		count++
		var value = data[property]
		if (value != null && typeof value == 'object') value = JSON.stringify(value)
		result += '<li>' + property + ': ' + value + '</li>'
	}
	result = '<h2>Response</h2><p>LinkedIn response contained ' + count + ' fields:</p>' + result + '</ol>'
	return result
}
