"use strict";

angular
	.module('monitool.directives.projectForm', [])

	/**
	 * This directive shows a select box with all the raw variables from the given project.
	 */
	.directive('projectActivityVariable', function() {
		return {
			restrict: 'AE',
			template: '<select class="form-control input-sm" ng-model="planning.variable" ng-options="v.id as v.name group by v.group for v in sources"></select>',
			scope: {
				'project': '=',
				'planning': '='
			},
			link: function($scope) {
				$scope.$watch('project', function(project) {
					$scope.sources = [{id: null, name: "---", group: null}];
					$scope.project.forms.forEach(function(form) {
						form.elements.forEach(function(element) {
							$scope.sources.push({id: element.id, name: element.name, group: form.name, element: element});
						});
					});
				});
			}
		}
	})

	/**
	 * This directive shows a multi select box with all the filters that can be applied to a given variable in a project.
	 */
	.directive('projectActivityFilter', function(itertools) {

		/**
		 * Search a variable in a project.
		 */
		var findVariable = function(project, variableId) {
			var numForms = project.forms.length;
			for (var i = 0; i < numForms; ++i) {
				var form = project.forms[i],
					numElements = form.elements.length;

				for (var k = 0; k < numElements; ++k)
					if (form.elements[k].id === variableId)
						return form.elements[k];
			}
	 	};

		return {
			restrict: "AE",
			templateUrl: "partials/projects/indicators/_activity-filter-selector.html",
			scope: {
				'project': '=',
				'planning': '='
			},
			link: function($scope) {
				$scope.$watch('planning.variable', function(variableId, oldVariableId) {
					// Find the variable in the forms.
					var variable = findVariable($scope.project, variableId);

					if (variable)
						$scope.filters = itertools.product(variable.partitions).map(function(filter) {
							return {
								id: filter.pluck('id').sort().join('.'),
								name: filter.pluck('name').join(' / ')
							};
						});
					else
						$scope.filters = null;

					if (variableId !== oldVariableId)
						$scope.planning.filter.splice(0, $scope.planning.filter.length);
				});
			}
		}
	});
