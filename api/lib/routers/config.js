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
import pkg from '../../package.json';
import config from '../config/config';

const router = new Router();

/**
 * Index page.
 * Content will depend on the auth providers and debug mode.
 */
router.get('/config', ctx => {
	ctx.response.body = {
		version: pkg.version,
		trainingLabel: config.auth.providers.training ? config.auth.providers.training.label : null,
		azureLabel: config.auth.providers.azureAD ? config.auth.providers.azureAD.label : null,
		googleKey: config.api.google
	};
});


export default router;

