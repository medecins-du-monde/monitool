"use strict";

var forms = angular.module('monitool.directives.form', []);

forms.directive('lowerThan', function() {
	return {
		require: 'ngModel',

		link: function($scope, $element, $attrs, ctrl) {
			var validate = function(viewValue) {
				var comparisonModel = $attrs.lowerThan;

				if (!viewValue || !comparisonModel)
					// It's valid because we have nothing to compare against
					ctrl.$setValidity('lowerThan', true);
				
				else
					// It's valid if model is lower than the model we're comparing against
					ctrl.$setValidity('lowerThan', viewValue < comparisonModel);

				return viewValue;
			};

			ctrl.$parsers.unshift(validate);
			ctrl.$formatters.push(validate);

			$attrs.$observe('lowerThan', function(comparisonModel){
				// Whenever the comparison model changes we'll re-validate
				return validate(ctrl.$viewValue);
			});
		}
	};
});

forms.directive('greaterThan', function() {
	return {
		require: 'ngModel',

		link: function($scope, $element, $attrs, ctrl) {
			var validate = function(viewValue) {
				var comparisonModel = $attrs.greaterThan;

				if (!viewValue || !comparisonModel)
					// It's valid because we have nothing to compare against
					ctrl.$setValidity('greaterThan', true);
				
				else
					// It's valid if model is lower than the model we're comparing against
					ctrl.$setValidity('greaterThan', viewValue > comparisonModel);

				return viewValue;
			};

			ctrl.$parsers.unshift(validate);
			ctrl.$formatters.push(validate);

			$attrs.$observe('greaterThan', function(comparisonModel){
				// Whenever the comparison model changes we'll re-validate
				return validate(ctrl.$viewValue);
			});
		}
	};
});




function isEmpty(value) {
  return angular.isUndefined(value) || value === '' || value === null || value !== value;
}

forms.directive('ngMin', function() {
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
			  } else {
				ctrl.$setValidity('ngMin', true);
				return value;
			  }
			};

			ctrl.$parsers.push(minValidator);
			ctrl.$formatters.push(minValidator);
		}
	};
});

forms.directive('ngMax', function() {
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
			  } else {
				ctrl.$setValidity('ngMax', true);
				return value;
			  }
			};

			ctrl.$parsers.push(maxValidator);
			ctrl.$formatters.push(maxValidator);
		}
	};
});


forms.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13) {
				scope.$apply(function (){
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});
