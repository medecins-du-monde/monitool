
var passport = require('passport'),
    OAuth2Strategy = require('passport-oauth2'),
    config   = require('../config'),
    User     = require('./models/user');


// hook to serialize in-memory user to session cookie
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

// hook to deserialize session cookie to in-memory user (pulled from mongo)
passport.deserializeUser(function(id, done) {
    User.get(id, function(error, user) {
        done(error, user);
    });
});

// configure passport to use our Azure-specific OAuth2 strategy
var strategy = new OAuth2Strategy({
        authorizationURL: config.oauth.authUrl,   // first part of oauth2 handshake
        tokenURL: config.oauth.tokenUrl,          // second part of oauth2 handshake
        clientID: config.oauth.clientId,          // uniquely identifies your Azure application
        clientSecret: config.oauth.clientSecret,  // app-specific generated secret
        callbackURL: config.oauth.callbackUrl     // invoked by Azure upon auth sequence completion
    },
    // this method is invoked upon auth sequence completion
    //  its your hook to cache the access/refresh tokens, post-process the Azure profile, etc.
    function (accessToken, refreshToken, profile, done) {
        var userId = 'usr:' + profile.unique_name.substring(0, profile.unique_name.indexOf('@'));

        User.get(userId, function(error, user) {
            if (error) {
                user = {_id: userId, type: 'user', name: profile.name, roles: []};
                User.set(user, function(error, result) {
                    done(null, user);
                });
            }
            else if (user.name !== profile.name) {
                user.name = profile.name;
                User.set(user, function(error, result) {
                    done(null, user);
                });
            }
            else
                done(null, user);
        });
    });

// Azure AD requires an additional 'resource' parameter for the token request
//  this corresponds to the Azure resource you're requesting access to
//  in our case we're just trying to authenticate, so we just request generic access to the Azure AD graph API
strategy.tokenParams = strategy.authorizationParams = function(options) {
    return { resource: config.oauth.resource };
};

// this is our custom logic for digging into the token returned to us by Azure
//  in raw form its base64 text and we want the corresponding JSON
strategy.userProfile = function(accessToken, done) {
    // thx: https://github.com/QuePort/passport-azure-oauth/blob/master/lib/passport-azure-oauth/strategy.js
    var profile = {};
    try {
        var tokenBase64 = accessToken.split('.')[1];
        var tokenBinary = new Buffer(tokenBase64, 'base64');
        var tokenAscii = JSON.parse(tokenBinary.toString());
        done(null, tokenAscii);
    } catch (ex) {
        done(ex, null);
    }
};

passport.use(strategy);

module.exports = passport;