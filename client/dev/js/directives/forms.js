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


	/**
	 * This directive allows coloring bullet points on the indicator input form
	 * to tell the user if the data that is being entered is out of bounds
	 */
	.directive('inputStatus', function() {
		return {
			restrict: 'A',
			link: function($scope, element) {
				$scope.$watch('currentInput.values[field.model]', function() {
					var planning  = $scope.project.indicators[$scope.field.id],
						value     = $scope.currentInput.values[$scope.field.model];

					if (planning.target === null || planning.baseline === null || value === undefined || value === null || Number.isNaN(value))
						element.css('color', '');
					
					else {
						var progress;
						if (planning.target === 'around_is_better')
							progress = 100 * (1 - Math.abs(value - planning.target) / (planning.target - planning.baseline));
						else
							progress = 100 * (value - planning.baseline) / (planning.target - planning.baseline);

						if (progress < planning.showRed)
							element.css('color', 'red');
						else if (progress < planning.showYellow)
							element.css('color', 'orange');
						else
							element.css('color', 'green');
					}
				});
			}
		}
	})

// From https://docs.angularjs.org/guide/forms
	.directive('contenteditable', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      // view -> model
      elm.on('blur', function() {
        scope.$apply(function() {
          ctrl.$setViewValue(elm.html());
        });
      });

      // model -> view
      ctrl.$render = function() {
        elm.html(ctrl.$viewValue);
      };

      // load init value from DOM
      // ctrl.$setViewValue(elm.html());
    }
  };
});