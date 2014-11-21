var request  = require('request'),
	readline = require('readline-sync');

var host     = readline.question('host [localhost]: ') || 'localhost',
	port     = readline.question('port [5984]: ') || 5984,
	bucket   = readline.question('bucket [monitool]: ') || 'monitool',
	username = readline.question('login []: '),
	password = readline.question('password []: ');


request({
	method: 'PUT',
	auth: {user: username, pass: password},
	url: 'http://' + host + ':' + port + '/' + bucket + '/_design/monitool',
	json: require('./_design/monitool')
}, function(error, response, doc) {
	if (!error)
		console.log('Written design doc');
	else
		console.log('Failed to write design doc');
});

