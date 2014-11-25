var request  = require('request'),
	readline = require('readline-sync');

var host     = readline.question('host [localhost]: ') || 'localhost',
	port     = readline.question('port [5984]: ') || 5984,
	bucket   = readline.question('bucket [monitool]: ') || 'monitool',
	auth     = {user: readline.question('login []: '), pass: readline.question('password []: ')},
	url      = 'http://' + host + ':' + port + '/' + bucket + '/_design/monitool';

request({method: 'GET', auth: auth, url: url}, function(error, response, doc) {
	var newDdoc = require('./_design/monitool');
	newDdoc._rev = JSON.parse(doc)._rev;

	request({method: 'PUT', auth: auth, url: url, json: newDdoc}, function(error, response, doc) {
		console.log(doc)
	});
});
