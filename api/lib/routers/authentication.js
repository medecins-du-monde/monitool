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

import Router from 'koa-router';
import passport from '../passport';
import config from '../config/config';

const router = new Router();

///////////////////////////////////////////////////////////////
// Configure Login/Logout routes.
///////////////////////////////////////////////////////////////


/**
 * This handler is POSTed to validate the username and password of partners
 */
router.post(
	'/authentication/login-partner',
	passport.authenticate('partner_local', {
		successRedirect: '/',
		failureRedirect: '/?failed'
	})
)

/**
 * Log current user out.
 * FIXME This query should be POST: loggin an user out is not idempotent.
 */
router.post('/authentication/logout', async ctx => {
    ctx.logout();
    ctx.response.status = 200;
});


if (config.auth.providers.azureAD) {

	/**
	 * This handler is called to log in users with azure oauth.
	 * It checks if user is already logged in, and redirect to azure if not.
	 */
	router.get(
		'/authentication/login-azure',
		passport.authenticate('user_azure', {
			successRedirect: '/',
			failureRedirect: '/'
		})
	);

	/**
	 * This handler is called when users come back from azure.
	 */
	router.get(
		'/authentication/login-callback',
		passport.authenticate('user_azure', {
			successRedirect: '/',
			failureRedirect: '/'
		})
	);
}

if (config.auth.providers.training) {

	/**
	 * Log user in, without asking for a password
	 */
	router.post(
		'/authentication/login-training',
		passport.authenticate('training_local', {
			successRedirect: '/',
			failureRedirect: '/',
		})
	);
}

export default router;
