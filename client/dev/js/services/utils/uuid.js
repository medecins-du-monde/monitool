"use strict";

angular
	.module('monitool.services.utils.uuid', [])
	.service('uuid', function() {

		// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
		this.v4 = function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		};

	});