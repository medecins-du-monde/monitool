"use strict";

var monitoolDirectives = angular.module('MonitoolDirectives', []);


app.directive('lowerThan', function() {
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

app.directive('greaterThan', function() {
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