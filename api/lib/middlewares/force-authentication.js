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

import Project from '../resource/model/project';

/*
 * Check that user is properly authenticated
 */
export default async (ctx, next) => {
	if (ctx.isAuthenticated()) {
		ctx.visibleProjectIds = new Set(await Project.storeInstance.listVisibleIds(ctx.state.user));
		await next();
	}
	else {
		ctx.response.body = {
			error: "credentials_required",
			message: "Please provide either session cookie or an access token."
		};

		ctx.response.status = 401;
	}
};
