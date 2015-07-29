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
					$scope.project.dataCollection.forEach(function(form) {
						form.aggregatedData.forEach(function(section) {
							section.elements.forEach(function(element) {
								$scope.sources.push({id: element.id, name: element.name, group: section.name, element: element});
							});
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
			var numForms = project.dataCollection.length;
			for (var i = 0; i < numForms; ++i) {
				var form = project.dataCollection[i],
					numSections = form.aggregatedData.length;

				for (var j = 0; j < numSections; ++j) {
					var section = form.aggregatedData[j],
						numElements = section.elements.length;

					for (var k = 0; k < numElements; ++k)
						if (section.elements[k].id === variableId)
							return section.elements[k];
				}
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
								name: filter.pluck('name').join('/')
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
