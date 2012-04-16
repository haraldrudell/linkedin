// htmljson.js
// translate a json object to an html document
// wrap body to become an html document
exports.jsonHtml = jsonHtml

function html(body, title) {
	if (!title) title = 'Title'
	return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>' +
		title +
		'</title><link href="/server.css" rel="stylesheet" type="text/css"></head><body>\n' +
		body +  
		'\n</body></html>'
}

// convert data from json format to html
function jsonHtml(data, authenticateUri, register) {
	var myHtml = '<div><button onclick="parent.location=\''+
	authenticateUri +'\'">Authenticate Again</button>'

	if (register) {
		myHtml += '<br/>Get your own API Key at <a href=https://www.linkedin.com/secure/developer >https://www.linkedin.com/secure/developer</a>'
	}

	if (data.headline) {
		myHtml += '<h1>' +data.headline + '</h1>'
	}

	if (data.pictureUrl) {
		myHtml += '<img alt="Profile Picture" src=' +data.pictureUrl + ' />'
	}

	var fullName = getName(data)
	if (fullName) myHtml += '<p>' + fullName + '</p>'
	myHtml += '</div>'

	myHtml += allFields(data)
	
	return html(myHtml, fullName || 'LinkedIn response')
}

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
