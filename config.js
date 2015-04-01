
try {
	module.exports = require('./config.json');
}
catch (e) {
	module.exports = {
		"couchdb": {
			"url": process.env['couchdb.url'],
			"bucket": process.env['couchdb.bucket']
		},
		"oauth": {
			"authUrl": process.env['oauth.authUrl'],
			"tokenUrl": process.env['oauth.tokenUrl'],
			"clientId": process.env['oauth.clientId'],
			"clientSecret": process.env['oauth.clientSecret'],
			"callbackUrl": process.env['oauth.callbackUrl'],
			"resource": process.env['oauth.resource']
		}
	}
}
