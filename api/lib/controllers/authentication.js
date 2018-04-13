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

import express from 'express';
import passport from '../authentication/passport';
import config from '../config/config';
import bodyParser from 'body-parser';

const router = express.Router();

///////////////////////////////////////////////////////////////
// Configure Login/Logout routes.
///////////////////////////////////////////////////////////////


/**
 * This handler is POSTed to validate the username and password of partners
 */
router.post(
	'/login-partner',
	bodyParser.urlencoded({extended: false}),
	passport.authenticate('partner_local', {
		successRedirect: '/',
		failureRedirect: '/?failed'
	})
)

/**
 * Log current user out.
 * FIXME This query should be POST: loggin an user out is not idempotent.
 */
router.get('/logout', function(request, response) {
	request.session.destroy();
	request.logout();
	response.redirect('/');
});


if (config.auth.providers.azureAD) {

	/**
	 * This handler is called to log in users with azure oauth.
	 * It checks if user is already logged in, and redirect to azure if not.
	 */
	router.get(
		'/login-azure',

		// Check that user is not already logged in.
		function(request, response, next) {
			if (request.isAuthenticated && request.isAuthenticated() && request.user && request.user.type === 'user') {
				// we need to check for nextUrl because authorize may have sent us here if some dark cookie+302 magic prevented him from knowing who it was speaking to.
				if (request.session.nextUrl) {
					response.render('redirect', {url: request.session.nextUrl});
					delete request.session.nextUrl;
				}
				else
					response.render('redirect', {url: '/'});
			}
			else
				next();
		},

		passport.authenticate('user_azure')
	);

	/**
	 * This handler is called when users come back from azure.
	 */
	router.get(
		'/login-callback',

		passport.authenticate('user_azure', {
			failureRedirect: '/'
		}),

		function(request, response) {
			if (request.session.nextUrl) {
				response.render('redirect', {url: request.session.nextUrl});
				delete request.session.nextUrl;
			}
			else
				response.render('redirect', {url: '/'});
		}
	)
}

if (config.auth.providers.training) {

	/**
	 * Log user in, without asking for a password
	 */
	router.post(
		'/login-training',
		bodyParser.urlencoded({extended: false}),
		passport.authenticate('training_local', {
			successRedirect: '/',
			failureRedirect: '/',
		})
	);
}

export default router;
