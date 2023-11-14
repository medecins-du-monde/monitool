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

import passport from 'koa-passport';
import LocalStrategyModule from 'passport-local';
import OAuth2Strategy from 'passport-oauth2';
import passwordHash from 'password-hash';

import User from './resource/model/user';
import config from './config/config';

const LocalStrategy = LocalStrategyModule.Strategy;

/////////////////////////////////////////////////////////////////////////////
// User serialization
/////////////////////////////////////////////////////////////////////////////

passport.serializeUser(function(user, done) {
	if (user.type == 'user')
		done(null, user._id);

	else if (user.type === 'partner')
		done(null, 'partner:' + user.username);

	// clients are not allowed to have sessions, so this should never be called.
	// let's make sure of that
	else
		throw new Error('Invalid user');
});

passport.deserializeUser(function(id, done) {
	var type = id.substring(0, id.indexOf(':'));

	if (type === 'user') {
		let userPromise;
		if (config.auth.providers.training && id === 'user:' + config.auth.providers.training.account)
			userPromise = Promise.resolve(new User({
				_id: 'user:' + config.auth.providers.training.account,
				type: 'user',
				name: "Training account",
				role: 'common',
				active: true,
			}));
		else
			userPromise = User.storeInstance.get(id);

		userPromise
			.then(function(user) {
				// Upgrade user to administrator if specified in the configuration file.
				if ('user:' + config.auth.administrator === user._id)
					user.role = 'admin';
				// Update last login date
				updateLastLogin(user);

				done(null, user);
			})
			.catch(function(error) { done(error); });
	}
	else if (type === 'partner') {
		User.storeInstance
			.getPartner(id.substring('partner:'.length))
			.then(function(user) { 
				updateLastLogin(user);
				done(null, user);
			})
			.catch(function(error) { done(error); });
	}
	else
		throw new Error('Invalid user.');
});



/////////////////////////////////////////////////////////////////////////////
// User log in with Microsoft Azure Active Directory
/////////////////////////////////////////////////////////////////////////////

if (config.auth.providers.azureAD) {
	var strategy = new OAuth2Strategy(
		{
			authorizationURL: "https://login.windows.net/" + config.auth.providers.azureAD.tenantId + "/oauth2/authorize",
			tokenURL: "https://login.windows.net/" + config.auth.providers.azureAD.tenantId + "/oauth2/token",
			clientID: config.auth.providers.azureAD.clientId,
			clientSecret: config.auth.providers.azureAD.clientSecret,
			callbackURL: config.baseUrl + '/api/authentication/login-callback'
		},
		// This method is invoked upon auth sequence completion
		// Its the hook to cache the access/refresh tokens, post-process the Azure profile, etc.
		function (accessToken, refreshToken, profile, done) {
			try {
				var userId = 'user:' + profile.unique_name.substring(0, profile.unique_name.indexOf('@')),
					domain = profile.unique_name.substring(profile.unique_name.lastIndexOf('@') + 1);

				if (domain !== config.auth.providers.azureAD.domain)
					return done(
						"You must use an account from " +
						config.auth.providers.azureAD.domain + " (not " + domain + ").\n" +
						"Try closing and reopening your browser to log in again."
					);

				User.storeInstance.get(userId).then(
					function(user) {
						// If Oauth provider updated the name, we update as well in DB
						if (user.name !== profile.name) {
							user.name = profile.name;
							user.save(); // don't wait for the callback
						}
						// Update last login date
						updateLastLogin(user);

						// Auth was OK
						done(null, user);
					},
					function(error) {
						// This user never logged in!
						if (error.message === 'missing' || error.message === 'deleted') {
							var user = new User({
								_id: userId,
								type: 'user',
								name: profile.name,
								role: 'common',
								lastLogin: new Date().toISOString()
							});
							user.save().then(
								function() {
									done(null, user); // Auth is OK
								},
								function(error) {
									done('Error while creating' + error); // Something failed while creating user.
								}
							);
						}
						else {
							// Something else failed (db is down?).
							done('Internal error in the database ' + error);
						}
					}
				);
			}
			catch (e) {
				done("An error has occurred while logging you in. Are you using a medecinsdumonde.net account?");
			}
		}
	);
		
	// Azure AD requires an additional 'resource' parameter for the token request
	//  this corresponds to the Azure resource you're requesting access to
	//  in our case we're just trying to authenticate, so we just request generic access to the Azure AD graph API
	strategy.tokenParams = strategy.authorizationParams = function(options) {	
	return { resource: "https://graph.windows.net" };
	};
	// this is our custom logic for digging into the token returned to us by Azure
	//  in raw form its base64 text and we want the corresponding JSON
	strategy.userProfile = function(accessToken, done) {
		// thx: https://github.com/QuePort/passport-azure-oauth/blob/master/lib/passport-azure-oauth/strategy.js
		var profile = {};

		try {
			var tokenBase64 = accessToken.split('.')[1],
				tokenBinary = new Buffer(tokenBase64, 'base64'),
				tokenAscii  = JSON.parse(tokenBinary.toString());

			console.log('\n\n', 'Azure token:', tokenAscii, '\n\n');
			done(null, tokenAscii);
		}
		catch (ex) {
			done(ex, null);
		}
	};
	passport.use('user_azure', strategy);
}

/////////////////////////////////////////////////////////////////////////////
// User authentication with username and password (MDM partners)
/////////////////////////////////////////////////////////////////////////////

passport.use('partner_local', new LocalStrategy(
	function(username, password, done) {
		User.storeInstance.getPartner(username).then(
			function(partner) {
				if (!partner.active)
					return done(null, false);
				if (!passwordHash.verify(password, partner.password))
					return done(null, false);

				done(null, partner)
			},
			function(error) {
				if (error.message === 'missing')
					return done(null, false);
				else
					return done(error);
			}
		);
	}
));

/////////////////////////////////////////////////////////////////////////////
// User authentication with training account
/////////////////////////////////////////////////////////////////////////////

if (config.auth.providers.training) {
	passport.use('training_local', new LocalStrategy(
		function(username, password, done) {
			let trainingUser = new User({
				_id: 'user:' + config.auth.providers.training.account,
				type: 'user',
				name: "Training account",
				role: 'common',
				active: true,
				lastLogin: new Date().toISOString()
			});

			done(null, trainingUser);
		})
	);
}

export default passport;

const updateLastLogin = async (user) => {
  try {
    // if rev missing, check if user exists
    if (!user._rev) {
      const u = await User.storeInstance.get(user._id);
      if (!u) return;
      else user = u;
    }
    user.lastLogin = new Date().toISOString();
    await user.save();
  } catch (e) {}
};