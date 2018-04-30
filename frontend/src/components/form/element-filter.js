/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import angular from 'angular';


const module = angular.module(
	'monitool.components.form.elementfilter',
	[
	]
);


/**
 * This directive is a form control that allows to select multiple elements in a list.
 * To make thing faster than selecting one by one, it allows to select groups at once.
 */
module.directive('elementFilter', function(itertools, $filter) {

	/**
	 * Convert the model value to the array that will be used in the view.
	 * It merges elements that can be merged together using the group ids,
	 * then add the elements that are not in any group.
	 *
	 * For instance:
	 * 	model = ['element1', 'element2']
	 * 	elements = [{id: 'element1', ...}, {id: 'element2', ...}]
	 * 	groups = [{id: 'whatever', members: ['element1', 'element2']}]
	 *
	 * Will give
	 * 	['whatever']
	 */
	var model2view = function(model, elements, groups) {
		groups = groups || [];

		if (model.length == elements.length)
			return ['all'];

		// retrieve all groups that are in the list.
		var selectedGroups = groups.filter(function(group) {
			return itertools.isSubset(model, group.members);
		});
		var numSelectedGroups = selectedGroups.length;

		var additionalElements = model.filter(function(partitionElementId) {
			for (var i = 0; i < numSelectedGroups; ++i)
				if (selectedGroups[i].members.indexOf(partitionElementId) !== -1)
					return false;
			return true;
		});

		return selectedGroups.map(e => e.id).concat(additionalElements);
	};

	/**
	 * Convert the view array to the model value, by expanding all groups.
	 *
	 * For instance:
	 * 	view = ['whatever']
	 * 	elements = [{id: 'element1', ...}, {id: 'element2', ...}]
	 * 	groups = [{id: 'whatever', members: ['element1', 'element2']}]
	 *
	 * Will give
	 * 	['element1', 'element2']
	 */
	var view2model = function(view, elements, groups) {
		groups = groups || [];

		var model = {};

		view.forEach(function(id) {
			if (id == 'all')
				elements.forEach(function(e) { model[e.id] = true; });

			else {
				var group = groups.find(function(g) { return g.id == id; });
				if (group)
					group.members.forEach(function(m) { model[m] = true; });
				else
					model[id] = true;
			}
		});

		return Object.keys(model);
	};

	return {
		restrict: "E",
		require: "ngModel",
		scope: {
			elements: '=',
			groups: '='
		},
		template: require('./element-filter.html'),
		link: function(scope, element, attributes, ngModelController) {
			// This container is needed because we depend on ui-select, which can only see changed this way.
			scope.container = {};

			// When elements or groups definition change.
			scope.$watchGroup(['elements', 'groups'], function(newValues, oldValues) {
				// Reset the list of selectable elements.
				scope.selectableElements = [
					{id: 'all', name: $filter('translate')('project.all_elements')}
				].concat(scope.groups || []).concat(scope.elements);

				// Check that all selected elements are still valid.
				scope.container.selectedElements = scope.container.selectedElements.filter(function(id) {
					return !!scope.selectableElements.find(function(selectableElement) {
						return selectableElement.id == id;
					});
				});
			});

			ngModelController.$formatters.push(function(modelValue) {
				return model2view(modelValue, scope.elements, scope.groups);
			});

			ngModelController.$parsers.push(function(viewValue) {
				return view2model(viewValue, scope.elements, scope.groups);
			});

			ngModelController.$render = function() {
				scope.container.selectedElements = ngModelController.$viewValue;
			};

			scope.$watch('container.selectedElements', function(selectedElements) {
				if (selectedElements.length === 2 && selectedElements[0] === 'all')
					// Special case: we want to empty the list when a user select something over "all".
					scope.container.selectedElements = [selectedElements[1]];
				else
					// Evaluate the whole list to remove inconsistencies.
					scope.container.selectedElements = model2view(
						view2model(selectedElements, scope.elements, scope.groups),
						scope.elements,
						scope.groups
					);

				ngModelController.$setViewValue(selectedElements);
			}, true)
		}
	}
});


export default module;

