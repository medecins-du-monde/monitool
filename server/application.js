
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import path from 'path';

import config from './config';
import passport from './authentication/passport';
import sessionStore from './authentication/session-store';

import authenticationController from './controllers/authentication';
import pagesController from './controllers/pages';
import pdfController from './controllers/pdf';
import reportingController from './controllers/reporting';
import resourcesController from './controllers/resources';
import staticController from './controllers/static';

import forceAuthenticationMiddleware from './middlewares/force-authentication';
import loggerMiddleware from './middlewares/logger';
import statusCodeMiddleware from './middlewares/status-code';


export default express()
	// Basic Configuration
	.disable('x-powered-by') // Remove useless header.
	.set('view engine', 'pug') // Enable template engine.
	.set('views', path.join(__dirname, '../server/views'))

	// By default users should never cache anything.
	.use(function(request, response, next) {
		response.setHeader('Cache-Control', 'max-age=0,public');
		next();
	})

	.use(loggerMiddleware)

	// Serve static files.
	.use(staticController)

	// Enable dynamic sessions and compression for the rest.
	.use(cookieParser())
	.use(session({secret: config.cookieSecret, resave: false, saveUninitialized: false, store: sessionStore}))
	.use(passport.initialize())
	.use(passport.session())
	.use(compression())

	// Serve index page.
	.use(pagesController)

	// Serve authentication related pages.
	.use('/authentication', authenticationController) // eg: login page, ...

	// Serve API
	.use(forceAuthenticationMiddleware)		// From now on, all pages require auth
	.use(statusCodeMiddleware)				// Add helpers to the response object
	.use('/resources', pdfController)		// PDF generation module
	.use('/resources', resourcesController)	// REST JSON API
	.use('/reporting', reportingController)	// Reporting API
