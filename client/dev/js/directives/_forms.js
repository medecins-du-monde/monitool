"use strict";

function isEmpty(value) {
	return angular.isUndefined(value) || value === '' || value === null || value !== value;
};

angular.module('monitool.directives.form', [])

	.directive('ngMin', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, elem, attributes, controller) {
				$scope.$watch(attributes.ngMin, function(){
					controller.$setViewValue(controller.$viewValue);
				});

				var minValidator = function(value) {
					var min = $scope.$eval(attributes.ngMin) || 0;
					if (!isEmpty(value) && value < min) {
						controller.$setValidity('ngMin', false);
						return undefined;
					}
					else {
						controller.$setValidity('ngMin', true);
						return value;
					}
				};

				controller.$parsers.push(minValidator);
				controller.$formatters.push(minValidator);
			}
		};
	})

	.directive('ngMax', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, elem, attributes, controller) {
				$scope.$watch(attributes.ngMax, function(){
					controller.$setViewValue(controller.$viewValue);
				});

				var maxValidator = function(value) {
					var max = $scope.$eval(attributes.ngMax) || Infinity;
					if (!isEmpty(value) && value > max) {
						controller.$setValidity('ngMax', false);
						return undefined;
					}
					else {
						controller.$setValidity('ngMax', true);
						return value;
					}
				};

				controller.$parsers.push(maxValidator);
				controller.$formatters.push(maxValidator);
			}
		};
	})

	.directive('ngEnter', function() {
		return function ($scope, element, attributes) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 13) {
					$scope.$apply(function(){
						$scope.$eval(attributes.ngEnter);
					});

					event.preventDefault();
				}
			});
		};
	})

	// From https://docs.angularjs.org/guide/forms
	.directive('mtContentEditable', function() {
		return {
			require: 'ngModel',
			link: function($scope, element, attributes, controller) {
				element.attr('contenteditable', true);

				// view -> model
				element.on('blur', function() {
					$scope.$apply(function() {
						var text = element.text()

						if (!attributes.allowWhitespace)
							text = text.replace(/\s+/g, " ")

						element.html(text);
						controller.$setViewValue(text);
					});
				});

				// model -> view
				controller.$render = function() {
					element.html(controller.$viewValue);
				};
			}
		};
	})
	
	.directive('textarea', function() {
		return {
			restrict: 'E',
			link: function($scope, element) {
				var currentTimeout;

				var resize = function() {
					if (element[0].scrollHeight !== 0) {
						element[0].style.height = '1px';
						var newHeight = Math.max(24, element[0].scrollHeight + 3);

						element[0].style.height = newHeight + "px";
					}
					else {
						// This is a bit of a hack, but there seems to be no DOM event i can listen for
						// to know when the element becomes visible
						currentTimeout = setTimeout(resize, 250);
					}
				};

				setTimeout(resize, 0);
				element.on("blur keyup change", resize);

				$scope.$on("$destroy", function() {
					if (currentTimeout)
						clearTimeout(currentTimeout);
				});
			}
		};
	});

