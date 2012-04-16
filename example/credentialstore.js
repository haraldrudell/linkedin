// credentialstore.js
// save and load Oauth access parameters
exports.readStore = readStore
exports.writeStore = writeStore

function readStore() {
	return null
}

function writeStore(credentials) {
	console.log('saving credentials:', credentials)
}
