"use strict";

var statusCodes = {
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

module.exports = function(request, response, next) {

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
