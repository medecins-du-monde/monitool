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
	});

