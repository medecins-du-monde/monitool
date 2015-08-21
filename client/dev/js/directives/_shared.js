"use strict";

angular.module('monitool.directives.shared', [])

	.directive('faBoolean', function() {
		return {
			restrict: 'AE',
			scope: { v: "=faBoolean" },
			link: function($scope, element) {
				element.addClass('fa');

				$scope.$watch('v', function(newValue) {

					if (newValue) {
						element.removeClass('fa-times');
						element.css('color', 'green');
						element.addClass('fa-check');
					}
					else {
						element.removeClass('fa-check');
						element.css('color', 'red');
						element.addClass('fa-times');
					}
				});
			}
		}
	})

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

	.directive('docReminder', function() {
		return {
			restrict: 'E',
			templateUrl: 'partials/doc-reminder.html',
			scope: { 'pages': '@' },
			link: function($scope) {
				$scope.unreadPages = [];
				$scope.pages.split(',').forEach(function(page) {
					var elts = page.split('.');
					if (!window.localStorage['doc.' + elts[1]])
						$scope.unreadPages.push({block: elts[0], page: elts[1]});
				});
			}
		}
	})

	.directive('disableIf', function() {
		return {
			retrict: 'A',
			scope: {
				disableIf: "="
			},
			link: function($scope, element, attributes) {
				$scope.$watch('disableIf', function(disable) {
					if (disable)
						element.addClass('disabled')
					else
						element.removeClass('disabled')
				});
			}
		}
	})

	.directive('eatClickIf', function($parse, $rootScope) {
		return {
		 	// this ensure eatClickIf be compiled before ngClick
			priority: 100,
			restrict: 'A',
			compile: function($element, attr) {
				var fn = $parse(attr.eatClickIf);
				return {
					pre: function link(scope, element) {
						var eventName = 'click';

						element.on(eventName, function(event) {
							var callback = function() {
								if (fn(scope, {$event: event})) {
									// prevents ng-click to be executed
									event.stopImmediatePropagation();
									// prevents href 
									event.preventDefault();
									return false;
								}
							};

							if ($rootScope.$$phase)
								scope.$evalAsync(callback);
							else
								scope.$apply(callback);
						});
					},
					post: function() {}
				};
			}
		}
	});
