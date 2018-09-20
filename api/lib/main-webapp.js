/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import winston from 'winston';

import application from './application';
import config from './config/config';
import database from './resource/database';

// Catch the uncaught errors that weren't wrapped in a domain or try catch statement
process.on('uncaughtException', function(err) {
	// This should absolutely never be called, as we handle all errors insides promises.
	console.log(err.stack)
});

async function tryStartApplication() {
	// Wait for database.
	try {
		await database.checkConnectivity();
	}
	catch (error) {
		winston.log('warning', 'Could not connect database: ' + error.message + '. Retry in 15 seconds.');
		setTimeout(startApplication, 15 * 1000);
		return;
	}

	// Create bucket / Migrate if needed
	await database.prepare();

	// Crash if we fail to listen.
	application.listen(config.port);
}

function startApplication() {
	tryStartApplication().catch(error => {
		winston.log('error', error.message);
		process.exit(1)
	});
}

startApplication();
