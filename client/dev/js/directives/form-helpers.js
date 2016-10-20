"use strict";

angular.module('monitool.directives.formHelpers', [])

	.directive('autoResize', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, element, attributes) {

				var resize = function() {
					element[0].style.height = '1px';
					var newHeight = Math.max(24, element[0].scrollHeight + 3);

					element[0].style.height = newHeight + "px";
				};

				$scope.$watch(attributes.ngModel, function(newValue) {
					resize();
				});

				element.on("blur", resize);
				element.on("keyup", resize);
				element.on("change", resize);
			}
		};
	})
