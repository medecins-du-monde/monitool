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

import config from '../config';

const statusCodes = {
	wrong_type: 400,	// id collision
	forbidden: 403,		// trying to get forbidden item

	// list
	invalid_mode: 400,	// unknown mode: ex project?mode=withoutname
	missing_parameter: 400,	// required parameter is missing for given mode.

	// fetch
	missing: 404,		// trying to get non existing item

	// put
	id_mismatch: 400,	// id in URL and model do not match
	invalid_data: 400,	// saving entity that did not pass validation
	missing_data: 400,  // ???
	invalid_reference: 400, // foreign key fail.
};


export default function(request, response, next) {

	response.jsonError = function(error) {
		response.status(statusCodes[error.message] || 500);

		if (config.debug)
			response.json(error);
		else
			response.json({message: error.message});
	};

	response.jsonErrorPB = response.jsonError.bind(response);
	response.jsonPB = response.json.bind(response);

	next();
};
