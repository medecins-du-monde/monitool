"use strict";

angular
	.module('monitool.directives.indicatorForm', [])

	.directive('formula', function() {
		return {
			scope: { formula: '=' },
			templateUrl: 'partials/indicators/edit-formula.html',
		}
	})

