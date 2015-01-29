"use strict";

var express = require('express'),
	router  = express.Router();


// Reporting routes.
router.get('/project/:projectId/reporting', function(request, response) {
	// groupId[]=whatever
	// entityId[]=whatever
	// begin=whatever
	// end=whatever


});

router.get('/indicator/:id/reporting', function(request, response) {
	// projectId[]=whatever
	// groupId[]=whatever
	// entityId[]=whatever
	// withGroups=1/0
	// begin=whatever
	// end=whatever
	// ...

});

module.exports = router;