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

"use strict";

angular.module('monitool.directives.formControls', [])


	.directive('indicator', function($uibModal) {
		return {
			restrict: 'E',
			templateUrl: "partials/_forms/indicator.html",
			scope: {
				indicator: '=',
				indicatorList: '=',
				editableProject: '=project'
			},
			link: function($scope) {
				$scope.editIndicator = function() {
					var promise = $uibModal.open({
						controller: 'ProjectIndicatorEditionModalController',
						templateUrl: 'partials/projects/structure/edition-modal.html',
						size: 'lg',
						scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
						resolve: {
							planning: function() { return $scope.indicator; },
							indicator: function() { return null; }
						}
					}).result;

					promise.then(function(newIndicator) {
						var indicator = $scope.indicator;

						if (indicator && !newIndicator)
							$scope.indicatorList.splice($scope.indicatorList.indexOf(indicator), 1);
						else if (!indicator && newIndicator)
							$scope.indicatorList.push(newIndicator);
						else if (indicator && newIndicator)
							$scope.indicatorList.splice($scope.indicatorList.indexOf(indicator), 1, newIndicator);
					});
				};
			}
		}
	})

	// Work around bug in angular ui datepicker
	// https://github.com/angular-ui/bootstrap/issues/6140
	.directive('utcDatepicker', function() {
		return {
			restrict: 'E',
			require: 'ngModel',
			template: '<input type="text" uib-datepicker-popup="longDate" ng-model="localDate" is-open="dateOpen" ng-click="dateOpen=true" required datepicker-options="options" class="form-control" />',
			scope: {},
			link: function(scope, element, attributes, ngModelController) {

				ngModelController.$formatters.push(function(modelValue) {
					return new Date(modelValue.getTime() + modelValue.getTimezoneOffset() * 60 * 1000);
				});

				ngModelController.$parsers.push(function(viewValue) {
					return new Date(viewValue.getTime() - viewValue.getTimezoneOffset() * 60 * 1000);
				});

				ngModelController.$render = function() {
					scope.localDate = ngModelController.$viewValue;
				};

				scope.$watch('localDate', function(localDate) {
					ngModelController.$setViewValue(localDate);
				});
			}
		}
	})

	.directive('optionalDate', function() {
		return {
			restrict: 'E',
			require: 'ngModel',
			templateUrl: 'partials/_forms/optional-date.html',
			scope: {
				defaultUTC: '=default'
			},
			link: function(scope, element, attributes, ngModelController) {
				scope.message = attributes.message;

				scope.$watch('defaultUTC', function(defaultUTC) {
					scope.defaultLocal = new Date(defaultUTC.getTime() + defaultUTC.getTimezoneOffset() * 60 * 1000);
				});

				scope.container = {};

				ngModelController.$render = function() {
					var dateUTC = ngModelController.$viewValue;
					if (dateUTC) {
						scope.container.dateLocal = new Date(dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60 * 1000);
						scope.specifyDate = true;
					}
					else {
						scope.container.dateLocal = null;
						scope.specifyDate = false;
					}
				};

				scope.$watch('container.dateLocal', function(newDateLocal, oldDateLocal) {
					if (newDateLocal === oldDateLocal)
						return;

					if (newDateLocal)
						ngModelController.$setViewValue(new Date(newDateLocal.getTime() - newDateLocal.getTimezoneOffset() * 60 * 1000));
					else
						ngModelController.$setViewValue(null);
				});

				scope.$watch('specifyDate', function(newValue, oldValue) {
					if (oldValue === newValue)
						return;

					if (newValue) {
						var dateUTC = scope.defaultUTC;
						scope.container.dateLocal = new Date(dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60 * 1000);
					}
					else {
						scope.container.dateLocal = null;
					}
				});
			}
		}
	})

	.directive('optionalNumber', function() {
		return {
			restrict: 'E',
			require: 'ngModel',
			templateUrl: 'partials/_forms/optional-number.html',
			scope: {default:'=default'},
			link: function(scope, element, attributes, ngModelController) {
				scope.message = attributes.message;
				scope.container = {};

				ngModelController.$render = function() {
					var numberValue = ngModelController.$viewValue;
					if (numberValue !== null) {
						scope.specifyValue = true;
						scope.container.chosenValue = numberValue;
					}
					else {
						scope.specifyValue = false;
						scope.container.chosenValue = null;
					}
				};

				scope.$watch('container.chosenValue', function(newValue, oldValue) {
					if (newValue === oldValue)
						return;

					ngModelController.$setViewValue(newValue);
				});

				scope.$watch('specifyValue', function(newSpecifyValue, oldSpecifyValue) {
					if (newSpecifyValue === oldSpecifyValue)
						return;

					if (newSpecifyValue)
						scope.container.chosenValue = scope.default;
					else
						scope.container.chosenValue = null;
				});

			}
		}
	})


	.directive('partitionDistribution', function(itertools) {
		return {
			restrict: "E",
			require: "ngModel",
			scope: {
				numPartitions: '='
			},
			templateUrl: "partials/_forms/partition-distribution.html",
			link: function(scope, element, attributes, ngModelController) {
				// This unique identifier used for the radio name. This is the same for all radios.
				scope.uniqueIdentifier = 'i_' + Math.random().toString().slice(2);

				// We need to use a container for the distribution value because we use it inside a ng-repeat which have its own scope
				scope.container = {}

				// To render the ngModelController, we just pass the distribution value to the scope.
				ngModelController.$render = function() {
					scope.container.distribution = ngModelController.$viewValue;
				};

				// When the chosen distribution changes, we tell the ngModelController
				scope.$watch('container.distribution', function(d) {
					ngModelController.$setViewValue(d);
				});

				// At start and when numPartitions changes...
				scope.$watch("numPartitions", function(numPartitions) {
					// ... we check that current distribution is valid.
					if (scope.container.distribution > numPartitions)
						scope.container.distribution = 0;

					// ... we redraw the tables when the user changes the number of partitions.
					scope.tables = [];

					for (var distribution = 0; distribution <= numPartitions; ++distribution) {
						scope.tables.push({
							// distribution will be the value for each radio.
							distribution: distribution,

							// Unique identifier used for each radio. This is to match the label with each radio.
							uniqueIdentifier: 'i_' + Math.random().toString().slice(2),

							// rows and cols for this table.
							leftCols: itertools.range(0, distribution),
							headerRows: itertools.range(distribution, numPartitions)
						});
					}
				});
			}
		};
	})

	.directive('partitionOrder', function(itertools) {
		return {
			restrict: "E",
			require: "ngModel",
			scope: {
				partitions: '=',
				distribution: '='
			},
			templateUrl: "partials/_forms/partition-order.html",
			link: function(scope, element, attributes, ngModelController) {
				var updateSize = function() {
					// update the size value
					var width = 1, height = 1;
					scope.table.headerRows.forEach(function(index) { width *= scope.orderedPartitions[index].elements.length; });
					scope.table.leftCols.forEach(function(index) { height *= scope.orderedPartitions[index].elements.length; });
					scope.size = width + ' x ' + height;
				};

				// we should only watch partitions.length, partitions[*].id and partitions[*].name
				// but that will do it.
				// however it's a bit overkill (will reset partitin order when we change an element name)
				scope.$watch('partitions', function(newValue, oldValue) {
					if (!angular.equals(oldValue, newValue)) {

						// Reset ordered partitions only when a partition was added or removed
						if (oldValue.length !== newValue.length) {
							scope.orderedPartitions = scope.partitions.slice();

							scope.table = {
								// rows and cols for this table.
								leftCols: itertools.range(0, scope.distribution),
								headerRows: itertools.range(scope.distribution, scope.partitions.length)
							};
						}
						else {
							// If the number of partitions was not changed, we need
							// to recreate .orderedPartitions anyway, because partition objects can be swapped
							// (not the same reference, even is the value is close).
							scope.orderedPartitions = scope.orderedPartitions.map(function(partition) {
								return scope.partitions.find(function(p) {
									return partition.id === p.id;
								});
							});
						}

						updateSize();
					}
				}, true);

				// Tell the template about the table layout
				scope.$watch('distribution', function() {
					scope.table = {
						// rows and cols for this table.
						leftCols: itertools.range(0, scope.distribution),
						headerRows: itertools.range(scope.distribution, scope.partitions.length)
					};

					updateSize();
				});

				// We do not allow values to be present 2 times in the list.
				scope.$watchCollection('orderedPartitions', function(after, before) {
					// Did last change cause a duplicate?
					var hasDuplicates = false,
						duplicates = {};

					for (var index = 0; index < scope.partitions.length; ++index)
						if (duplicates[after[index].id]) {
							hasDuplicates = true;
							break;
						}
						else
							duplicates[after[index].id] = true;

					// If we have duplicates it means the change was made by human action
					if (hasDuplicates) {
						// Remove the duplicate
						var changedIndex = 0
						for (; changedIndex < scope.partitions.length; ++changedIndex)
							if (after[changedIndex] !== before[changedIndex])
								break;

						var oldIndex = before.indexOf(after[changedIndex]);

						scope.orderedPartitions[oldIndex] = before[changedIndex];
					}

					// tell ngModelController that the viewValue changed
					ngModelController.$setViewValue(scope.orderedPartitions.slice());

					updateSize();
				});

				// To render the ngModelController, we just pass the orderedPartitions to the scope.
				ngModelController.$render = function() {
					scope.orderedPartitions = ngModelController.$viewValue.slice();
				};

				ngModelController.$parsers.push(function(viewValue) {
					return itertools.computePermutationIndex(
						scope.orderedPartitions.map(function(partition) {
							return scope.partitions.indexOf(partition);
						})
					);
				});

				ngModelController.$formatters.push(function(modelValue) {
					return itertools.computeNthPermutation(scope.partitions.length, modelValue)
									.map(function(index) { return scope.partitions[index]; });
				});
			}
		};
	})

	.directive('inputGrid', function(itertools, Parser) {
		var headerOptions = {
			readOnly: true,
			renderer: function(instance, td, row, col, prop, value, cellProperties) {
				Handsontable.renderers.TextRenderer.apply(this, arguments);
				td.style.color = 'black';
				td.style.background = '#eee';
			}
		};

		var dataOptions = {type: 'numeric', validator: /^\d+$/};

		/** This is a slightly changed version of pdf-export.js, we should refactor this */
		var makeRows = function(partitions) {
			var totalCols = partitions.reduce(function(memo, tp) { return memo * tp.elements.length; }, 1),
				currentColSpan = totalCols;

			var body = [];

			// Create header rows for top partitions
			partitions.forEach(function(tp) {
				// Update currentColSpan
				currentColSpan /= tp.elements.length;

				// Create header row
				var row = [];

				// Add one field for each element in tp, with current colspan
				for (var colIndex = 0; colIndex < totalCols; ++colIndex) {
					// Add field
					var tpe = tp.elements[(colIndex / currentColSpan) % tp.elements.length];
					row.push(tpe.name);

					// Add as many fillers as the colSpan value - 1
					var colLimit = colIndex + currentColSpan - 1;
					for (; colIndex < colLimit; ++colIndex)
						row.push("");
				}

				// push to body
				body.push(row);
			});

			return body;
		};

		/**
		 * Given the index of a field in a data vector, returns the index of the same field
		 * if the partitions were permutated
		 */
		var permutateDataIndex = function(element, originalIndex) {
			// Compute the order in which the partition are permutated. We need that later.
			var permutation = itertools.computeNthPermutation(element.partitions.length, element.order);

			// Use divmod operations to know which elements originalIndex comes from.
			var originalIdxs = new Array(element.partitions.length);
			for (var i = element.partitions.length - 1; i >= 0; --i) {
				originalIdxs[i] = originalIndex % element.partitions[i].elements.length;
				originalIndex = Math.floor(originalIndex / element.partitions[i].elements.length);
			}

			// Compute the new index in the permutatedData table.
			var permutatedIndex = 0;
			for (var i = 0; i < element.partitions.length; ++i) {
				// i-th contribution is the contribution of partition[permutation[i]]
				var j = permutation[i];
				permutatedIndex = permutatedIndex * element.partitions[j].elements.length + originalIdxs[j];
			}

			return permutatedIndex;
		};

		/**
		 * Permutate a complete data vector
		 */
		var permutateData = function(element, originalData) {
			var permutatedData = new Array(originalData.length);

			for (var originalIndex = 0; originalIndex < originalData.length; ++originalIndex) {
				var permutatedIndex = permutateDataIndex(element, originalIndex);
				permutatedData[permutatedIndex] = originalData[originalIndex];
			}

			return permutatedData;
		};

		/**
		 * Unpermutate a complete data vector
		 */
		var unpermutateData = function(element, permutatedData) {
			var originalData = new Array(permutatedData.length);

			for (var originalIndex = 0; originalIndex < originalData.length; ++originalIndex) {
				var permutatedIndex = permutateDataIndex(element, originalIndex);
				originalData[originalIndex] = permutatedData[permutatedIndex];
			}

			return originalData;
		};

		return {
			restrict: 'E',
			require: 'ngModel',
			template: "<div></div>",
			scope: {
				element: '='
			},
			link: function(scope, element, attributes, ngModelController) {

				// Convert a 1D array with all the data to a 2D table with headers.
				ngModelController.$formatters.push(function(modelValue) {
					// Special case! Having no partition does not cause having zero data fields
					if (scope.element.partitions.length === 0)
						return [modelValue];

					// We need the permutation later on.
					var permutation = itertools.computeNthPermutation(scope.element.partitions.length, scope.element.order);

					var viewValue = [];

					// Start by creating the headers.
					var partitions = permutation.map(function(index) { return scope.element.partitions[index]; });

					var colPartitions = partitions.slice(scope.element.distribution),
						rowPartitions = partitions.slice(0, scope.element.distribution);

					var topRows = makeRows(colPartitions),
						bodyRows = itertools.transpose2D(makeRows(rowPartitions));

					if (!bodyRows.length)
						bodyRows.push([])

					var dataColsPerRow = topRows.length ? topRows[0].length : 1;

					// Add data fields to bodyRows
					var permutatedData = permutateData(scope.element, modelValue)
					bodyRows.forEach(function(bodyRow) {
						Array.prototype.push.apply(bodyRow, permutatedData.splice(0, dataColsPerRow));
					});

					// Add empty field in the top-left corner for topRows
					topRows.forEach(function(topRow, index) {
						for (var i = 0; i < rowPartitions.length; ++i)
							topRow.unshift('');
					});

					return topRows.concat(bodyRows);
				});

				ngModelController.$parsers.push(function(viewValue) {
					// Special case! Having no partition does not cause having zero data fields
					if (scope.element.partitions.length === 0)
						return viewValue[0];

					var modelValue = [];
					for (var y = scope.element.partitions.length - scope.element.distribution; y < viewValue.length; ++y) {
						Array.prototype.push.apply(modelValue, viewValue[y].slice(scope.element.distribution));
					}

					return unpermutateData(scope.element, modelValue);
				});

				// Renders the $viewValue to screen

				var hotTable = null;

				ngModelController.$render = function() {
					// hotTable was not created yet, let's do it now
					if (!hotTable) {
						hotTable = new Handsontable(element[0].firstElementChild, {
							// Use all width with columns all the same size
							stretchH: "all",
							colWidths: 'xxx',
						    className: "htLeft",

							// Lock grid size so that user can't expand it.
							maxRows: ngModelController.$viewValue.length,
							maxCols: ngModelController.$viewValue[0].length,

							// Pass data
							data: ngModelController.$viewValue,

							// processing to do when the UI table is updated.
							afterChange: function(changes, action) {
								// changes === undefined when action === "loadData"
								// @see http://docs.handsontable.com/0.15.0-beta3/Hooks.html#event:afterChange
								if (changes) {
									// if the data that was entered is a formula (eg: 1+2) replace by evaluated value.
									changes.forEach(function(change) {
										var x = change[0], y = change[1], val = change[3];

										if (typeof val != 'number') {
											try { hotTable.setDataAtCell(x, y, Parser.evaluate(val, {})); }
											catch (e) { }
										}
									});

									// tell ngModelController that the data was changed from HandsOnTable.
									ngModelController.$setViewValue(hotTable.getData());
								}
							},

							cells: function(row, col, prop) {
								var isHeader = col < scope.element.distribution || row < scope.element.partitions.length - scope.element.distribution;
								return isHeader ? headerOptions : dataOptions;
							}
						});
					}
					else {
						// Update HandsOnTable data. We do not need to clone the table.
						hotTable.loadData(ngModelController.$viewValue);
					}
				};
			}
		}
	})


	.directive('indicatorComputation', function(itertools, Parser) {

		var PERCENTAGE_FORMULA = '100 * numerator / denominator',
			PERMILLE_FORMULA   = '1000 * numerator / denominator',
			COPY_FORMULA       = 'copied_value';

		return {
			restrict: 'E',
			require: 'ngModel',
			templateUrl: "partials/_forms/indicator-computation.html",
			scope: {
				forms: '='
			},
			link: function(scope, element, attributes, ngModelController) {
				scope.selectElements = [];
				scope.elementsById = {};
				scope.forms.forEach(function(form) {
					form.elements.forEach(function(element) {
						scope.elementsById[element.id] = element; // Use to find partition on view
						scope.selectElements.push({id: element.id, name: element.name, group: form.name}); // Used by selectbox
					});
				});

				scope.symbols = [];

				// The watch will be set by the render function to be sure the value is initialiazed
				var formulaWatch;

				var onFormulaChange = function(formula) {
					// Create and remove items in computation.parameters hash, when the formula changes.
					var newSymbols, oldSymbols = Object.keys(scope.computation.parameters);
					try { newSymbols = Parser.parse(scope.computation.formula).variables(); }
					catch (e) { newSymbols = []; }

					if (!angular.equals(newSymbols, oldSymbols)) {
						var addedSymbols = newSymbols.filter(function(s) { return oldSymbols.indexOf(s) === -1; });

						// Add new symbols to formula
						addedSymbols.forEach(function(s) {
							scope.computation.parameters[s] = {elementId: null, filter: {}};
						});
					}

					scope.symbols = newSymbols;
				};

				ngModelController.$render = function() {
					scope.computation = ngModelController.$viewValue;

					// we set the watch once the model is passed to the directive.
					if (!formulaWatch)
						formulaWatch = scope.$watch('computation.formula', onFormulaChange);
				};

				ngModelController.$parsers.push(function(viewValue) {
					if (scope.computation.type === 'unavailable')
						return null;

					else if (scope.computation.type === 'fixed')
						return {formula: scope.computation.formula, parameters: {}};

					else
						return {formula: scope.computation.formula, parameters: scope.computation.parameters};
				});

				ngModelController.$formatters.push(function(modelValue) {
					// Guess formula type with the content.
					if (modelValue === null)
						return {type: 'unavailable', formula: '', parameters: {}};

					else if (!isNaN(modelValue.formula))
						return {type: 'fixed', formula: modelValue.formula, parameters: {}};

					else if (modelValue.formula === COPY_FORMULA)
						return {type: 'copy', formula: COPY_FORMULA, parameters: modelValue.parameters};

					else if (modelValue.formula === PERCENTAGE_FORMULA)
						return {type: 'percentage', formula: PERCENTAGE_FORMULA, parameters: modelValue.parameters};

					else if (modelValue.formula === PERMILLE_FORMULA)
						return {type: 'permille', formula: PERMILLE_FORMULA, parameters: modelValue.parameters};

					else
						return {type: 'formula', formula: modelValue.formula, parameters: modelValue.parameters};
				});

				scope.$watch('computation', function() {
					ngModelController.$setViewValue(angular.copy(scope.computation));
				}, true);

				// when computation type is manually changed, update the formula.
				scope.$watch('computation.type', function() {
					// change fixed formula only if it is needed.
					if (scope.computation.type === 'fixed' && isNaN(scope.computation.formula))
						scope.computation.formula = '0';

					else if (scope.computation.type === 'copy')
						scope.computation.formula = COPY_FORMULA;

					else if (scope.computation.type === 'percentage')
						scope.computation.formula = PERCENTAGE_FORMULA;

					else if (scope.computation.type === 'permille')
						scope.computation.formula = PERMILLE_FORMULA;
				});
			}
		};
	})

	.directive('partitionsFilter', function() {

		return {
			restrict: 'E',
			require: "ngModel",
			scope: { element: '=' },
			templateUrl: 'partials/_forms/partitions-filter.html',

			link: function(scope, element, attributes, ngModelController) {

				scope.$watch('element', function(element, oldElement) {
					if (element === undefined || element === null)
						scope.filter = {};

					else if (element !== oldElement) {
						scope.filter = {};

						element.partitions.forEach(function(partition) {
							scope.filter[partition.id] = partition.elements.pluck('id');
						});
					}
				});

				ngModelController.$parsers.push(function(viewValue) {
					var modelValue = {};

					if (scope.element)
						scope.element.partitions.forEach(function(partition) {
							if (viewValue[partition.id].length !== partition.elements.length)
								modelValue[partition.id] = viewValue[partition.id];
						});

					return modelValue;
				});

				ngModelController.$formatters.push(function(modelValue) {
					var viewValue = {};

					if (scope.element)
						scope.element.partitions.forEach(function(partition) {
							if (modelValue[partition.id])
								viewValue[partition.id] = modelValue[partition.id];
							else
								viewValue[partition.id] = partition.elements.pluck('id');
						});

					return viewValue;
				});

				ngModelController.$render = function() {
					scope.filter = ngModelController.$viewValue;
				};

				scope.$watch('filter', function() {
					ngModelController.$setViewValue(angular.copy(scope.filter));
				}, true)
			}
		}
	})


	/**
	 * This directive is a form control that allows to select multiple elements in a list.
	 * To make thing faster than selecting one by one, it allows to select groups at once.
	 */
	.directive('elementFilter', function(itertools, $filter) {

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

			return selectedGroups.pluck('id').concat(additionalElements);
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
			templateUrl: 'partials/_forms/element-filter.html',
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
	})

