"use strict";

module.exports = function(request, response, next) {
	if (request.url.match(/^\/(glyphicons|fontawesome|monitool)/))
		response.setHeader('Cache-Control', 'max-age=31449600,public');
	else
		response.setHeader('Cache-Control', 'max-age=0,public');
	next();
};
