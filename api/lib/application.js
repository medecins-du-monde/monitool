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

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import session from 'koa-session'

import config from './config/config';
import passport from './passport';

import authenticationRouter from './routers/authentication';
import configRouter from './routers/config';
import pdfRouter from './routers/pdf';
import reportingRouter from './routers/reporting';
import resourcesRouter from './routers/resources';

import forceAuthenticationMiddleware from './middlewares/force-authentication';
import responseTimeMiddleware from 'koa-response-time';
import errorHandlerMiddleware from './middlewares/error-handler';

const app = new Koa();
app.keys = [config.cookieSecret];

app.use(responseTimeMiddleware());

// We use sessions & body parser
app.use(session({maxAge: 7 * 24 * 3600 * 1000}, app));
app.use(bodyParser({jsonLimit: '1mb'}));

// Serve the client-side config request, before authentication.
app.use(configRouter.routes());

// Enable authentication for the rest.
app.use(passport.initialize())
app.use(passport.session())

// Serve authentication related pages.
app.use(authenticationRouter.routes()) // eg: login page, ...

// Serve API
app.use(forceAuthenticationMiddleware)	// From now on, all pages require auth
app.use(errorHandlerMiddleware)			// Add helpers to the response object
app.use(pdfRouter.routes())				// PDF generation module
app.use(resourcesRouter.routes())		// REST JSON API
app.use(reportingRouter.routes())		// Reporting API

export default app;
