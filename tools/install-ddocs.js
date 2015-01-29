"use strict";

var request  = require('request'),
	readline = require('readline-sync');

var host      = readline.question('host [localhost]: ') || 'localhost',
	port      = readline.question('port [5984]: ') || 5984,
	appBucket = readline.question('bucket [monitool]: ') || 'monitool',
	auth      = {user: readline.question('login []: '), pass: readline.question('password []: ', {noEchoBack: true})},
	urlPrefix = 'http://' + host + ':' + port + '/';
	

var ddocs = {
	_users: { 
	},
	_bucket: {
		permissions: require('./_design/app_permissions'),
		reporting: require('./_design/app_reporting'),
		shortlists: require('./_design/app_shortlists'),
		server: require('./_design/server')
	}
};

Object.keys(ddocs).forEach(function(bucket) {
	Object.keys(ddocs[bucket]).forEach(function(ddoc) {
		var url = urlPrefix + (bucket === '_bucket' ? appBucket : bucket) + '/_design/' + ddoc;

		request({method: 'GET', auth: auth, url: url}, function(error, response, doc) {
			var newDdoc = ddocs[bucket][ddoc];
			newDdoc._rev = JSON.parse(doc)._rev;

			request({method: 'PUT', auth: auth, url: url, json: newDdoc}, function(error, response, doc) {
				console.log(doc)
			});
		});
	});
});
