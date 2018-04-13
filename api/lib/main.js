import application from './application';
import config from './config/config';
import database from './resource/database';
import winston from 'winston';

database.prepare().then(
	function() {
		application.listen(config.port);
	},
	function(error) {
		winston.log('error', 'Could not start database: ' + error.message);
		process.exit(1);
	}
);

// Catch the uncaught errors that weren't wrapped in a domain or try catch statement
process.on('uncaughtException', function(err) {
	// This should absolutely never be called, as we handle all errors insides promises.
	console.log(err.stack)
});

