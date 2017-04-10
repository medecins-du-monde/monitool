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

"use strict";

let passport    = require('../authentication/passport'),
	AccessToken = require('../resource/model/access-token'),
	Client      = require('../resource/model/client');

/*
 * Check that user is properly authenticated with a cookie.
 * and that it's really a user, not a client that found a way to get a cookie.
 */
module.exports = function(request, response, next) {
	if (request.isAuthenticated && request.isAuthenticated() && request.user && (request.user.type === 'user' || request.user.type === 'partner'))
		next();
	else {
		passport.authenticate('user_accesstoken', {session: false}, function(error, user, info) {
			// FIXME: not sure what this does 2 years after, only real users can have accesstokens?
			if (user && user.type === 'user') {
				request.user = user;
				next();
			}
			else
				response.status(401).json({
					error: "credentials_required",
					message: "Please provide either session cookie or an access token."
				});
		})(request, response, next);
	}
};

