
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import path from 'path';

import config from './config/config';
import passport from './authentication/passport';
import sessionStore from './authentication/session-store';

import authenticationController from './controllers/authentication';
import configController from './controllers/config';
import pdfController from './controllers/pdf';
import reportingController from './controllers/reporting';
import resourcesController from './controllers/resources';

import forceAuthenticationMiddleware from './middlewares/force-authentication';
import loggerMiddleware from './middlewares/logger';
import statusCodeMiddleware from './middlewares/status-code';


export default express()
	// Basic Configuration
	.disable('x-powered-by') // Remove useless header.
	.set('view engine', 'pug') // Enable template engine.
	.set('views', path.join(__dirname, 'views'))

	.use(loggerMiddleware)
	.use(configController)

	// Enable dynamic sessions for the rest.
	.use(cookieParser())
	.use(session({secret: config.cookieSecret, resave: false, saveUninitialized: false, store: sessionStore}))
	.use(passport.initialize())
	.use(passport.session())

	// Serve authentication related pages.
	.use('/authentication', authenticationController) // eg: login page, ...

	// Serve API
	.use(forceAuthenticationMiddleware)		// From now on, all pages require auth
	.use(statusCodeMiddleware)				// Add helpers to the response object
	.use('/resources', pdfController)		// PDF generation module
	.use('/resources', resourcesController)	// REST JSON API
	.use('/reporting', reportingController)	// Reporting API
