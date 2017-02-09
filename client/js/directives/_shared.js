"use strict";

angular.module('monitool.directives.shared', [])

	.directive('faOpen', function() {
		return {
			restrict: 'AE',
			scope: { v: "=faOpen" },
			link: function($scope, element) {
				element.addClass('fa');

				$scope.$watch('v', function(newValue) {
					if (newValue) {
						element.removeClass('fa-plus-circle');
						element.addClass('fa-minus-circle');
					}
					else {
						element.removeClass('fa-minus-circle');
						element.addClass('fa-plus-circle');
					}
				});
			}
		}
	})

	.directive('disableIf', function() {

		var inhibitHandler = function(event) {
			event.stopImmediatePropagation();
			event.preventDefault();
			return false;
		};

		return {
			retrict: 'A',
			priority: 100,
			scope: {
				disableIf: "="
			},
			link: function($scope, element, attributes) {
				$scope.$watch('disableIf', function(disable) {
					if (disable) {
						element.addClass('disabled')
						element.on('click', inhibitHandler);
					}
					else {
						element.removeClass('disabled')
						element.off('click', inhibitHandler);
					}
				});
			}
		}
	})

	// .directive('eatClickIf', function($parse, $rootScope) {
	// 	return {
	// 	 	// this ensure eatClickIf be compiled before ngClick
	// 		priority: 100,
	// 		restrict: 'A',
	// 		compile: function($element, attr) {
	// 			var fn = $parse(attr.eatClickIf);
	// 			return {
	// 				pre: function link(scope, element) {
	// 					var eventName = 'click';

	// 					element.on(eventName, function(event) {
	// 						var callback = function() {
	// 							if (fn(scope, {$event: event})) {
	// 								// prevents ng-click to be executed
	// 								// prevents href 
	// 								event.stopImmediatePropagation();
	// 								event.preventDefault();
	// 								return false;
	// 							}
	// 						};

	// 						if ($rootScope.$$phase)
	// 							scope.$evalAsync(callback);
	// 						else
	// 							scope.$apply(callback);
	// 					});
	// 				},
	// 				post: function() {}
	// 			};
	// 		}
	// 	}
	// });
