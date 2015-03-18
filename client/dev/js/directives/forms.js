"use strict";

function isEmpty(value) {
	return angular.isUndefined(value) || value === '' || value === null || value !== value;
};

angular.module('monitool.directives.form', [])
	.directive('ngMin', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function(scope, elem, attr, ctrl) {
				scope.$watch(attr.ngMin, function(){
					ctrl.$setViewValue(ctrl.$viewValue);
				});

				var minValidator = function(value) {
					var min = scope.$eval(attr.ngMin) || 0;
					if (!isEmpty(value) && value < min) {
						ctrl.$setValidity('ngMin', false);
						return undefined;
					}
					else {
						ctrl.$setValidity('ngMin', true);
						return value;
					}
				};

				ctrl.$parsers.push(minValidator);
				ctrl.$formatters.push(minValidator);
			}
		};
	})

	.directive('ngMax', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function(scope, elem, attr, ctrl) {
				scope.$watch(attr.ngMax, function(){
					ctrl.$setViewValue(ctrl.$viewValue);
				});

				var maxValidator = function(value) {
					var max = scope.$eval(attr.ngMax) || Infinity;
					if (!isEmpty(value) && value > max) {
						ctrl.$setValidity('ngMax', false);
						return undefined;
					}
					else {
						ctrl.$setValidity('ngMax', true);
						return value;
					}
				};

				ctrl.$parsers.push(maxValidator);
				ctrl.$formatters.push(maxValidator);
			}
		};
	})

	.directive('ngEnter', function() {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 13) {
					scope.$apply(function(){
						scope.$eval(attrs.ngEnter);
					});

					event.preventDefault();
				}
			});
		};
	})

	// From https://docs.angularjs.org/guide/forms
	.directive('contenteditable', function() {
		return {
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				// view -> model
				elm.on('blur', function() {
					scope.$apply(function() {
						var text = elm.text().replace(/\s+/g, " ");
						elm.html(text);
						ctrl.$setViewValue(text);
					});
				});

				// model -> view
				ctrl.$render = function() {
					elm.html(ctrl.$viewValue);
				};
			}
		};
	})

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
	});

