
try {
	module.exports = require('./config.json');
}
catch (e) {
	module.exports = {
		port: process.env.PORT,
		couchdb: {
			url: process.env['couchdb.url'],
			bucket: process.env['couchdb.bucket'],
			sessionBucket: process.env['couchdb.sessionBucket']
		},
		ping: {
			active: process.env['ping.active'],
			url: process.env['ping.url']
		},
		oauth: {
			authUrl: process.env['oauth.authUrl'],
			tokenUrl: process.env['oauth.tokenUrl'],
			clientId: process.env['oauth.clientId'],
			clientSecret: process.env['oauth.clientSecret'],
			callbackUrl: process.env['oauth.callbackUrl'],
			resource: process.env['oauth.resource']
		}
	}
}
