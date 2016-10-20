"use strict";

angular.module('monitool.directives.formControls', [])

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
			scope: {default:'=default'},
			link: function(scope, element, attributes, ngModelController) {

				scope.message = attributes.message;

				ngModelController.$formatters.push(function(modelValue) {
					if (modelValue === null)
						return {specifyDate: false, chosenDate: scope.default};
					else
						return {specifyDate: true, chosenDate: new Date(modelValue.getTime() + modelValue.getTimezoneOffset() * 60 * 1000)};
				});

				ngModelController.$parsers.push(function(viewValue) {
					return viewValue.specifyDate ? new Date(viewValue.chosenDate.getTime() - viewValue.chosenDate.getTimezoneOffset() * 60 * 1000) : null;
				});

				// We render using more ng-models and bindings, which make it a bit strange.
				// We should simply update the form values manually.
				ngModelController.$render = function() {
					scope.chosenDate = ngModelController.$viewValue.chosenDate;
					scope.specifyDate = ngModelController.$viewValue.specifyDate;
				};

				// if specifyDate change, we need to update the view value.
				scope.$watchGroup(['specifyDate', 'chosenDate'], function() {
					if (scope.specifyDate)
						ngModelController.$setViewValue({specifyDate: true, chosenDate: scope.chosenDate});

					else {
						scope.chosenDate = scope.default;
						ngModelController.$setViewValue({specifyDate: false, chosenDate: scope.default});
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

				ngModelController.$formatters.push(function(modelValue) {
					if (modelValue === null)
						return {specifyValue: false, chosenValue: scope.default};
					else
						return {specifyValue: true, chosenValue: modelValue};
				});

				// We render using more ng-models and bindings, which make it a bit strange.
				// We should simply update the form values manually.
				ngModelController.$render = function() {
					scope.chosenValue = ngModelController.$viewValue.chosenValue;
					scope.specifyValue = ngModelController.$viewValue.specifyValue;
				};

				// if specifyValue change, we need to update the view value.
				scope.$watchGroup(['specifyValue', 'chosenValue'], function() {
					if (scope.specifyValue)
						ngModelController.$setViewValue({specifyValue: true, chosenValue: scope.chosenValue});

					else {
						scope.chosenValue = scope.default;
						ngModelController.$setViewValue({specifyValue: false, chosenValue: scope.default});
					}
				});

				ngModelController.$parsers.push(function(viewValue) {
					return viewValue.specifyValue ? viewValue.chosenValue : null;
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

				// Tell the template about the table layout
				scope.$watch('distribution', function() {
					scope.table = {
						// rows and cols for this table.
						leftCols: itertools.range(0, scope.distribution),
						headerRows: itertools.range(scope.distribution, scope.partitions.length)
					};

					updateSize();
				})

				// We need to use a container for the distribution value because we use it inside a ng-repeat which have its own scope
				scope.orderedPartitions = scope.partitions.slice();

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

						// tell ngModelController that the viewValue changed
						ngModelController.$setViewValue(scope.orderedPartitions.slice());

						updateSize();
					}
				});

				// To render the ngModelController, we just pass the orderedPartitions to the scope.
				ngModelController.$render = function() {
					scope.orderedPartitions = ngModelController.$viewValue.slice();
				};

				ngModelController.$parsers.push(function(viewValue) {
					// FIXME bruteforcing this instead of doing proper math is O(scary)
					// It *should* be fast enough in practice as we have never seen more than 5 partitions (5! = 120 permutations)
					// Will be slow with 6 partitions, most likely broken with 7.
					var numPermutations = Math.factorial(scope.partitions.length);

					for (var permutationId = 0; permutationId < numPermutations; ++permutationId) {
						var permutation = itertools.computeNthPermutation(scope.partitions.length, permutationId);

						// compare array
						for (var i = 0; i < scope.partitions.length; ++i)
							if (permutation[i] !== scope.partitions.indexOf(scope.orderedPartitions[i]))
								break;

						// we have a match
						if (i == scope.partitions.length)
							return permutationId;
					}

					throw new Exception('Permutation was not found. Should not happen.');
				});

				ngModelController.$formatters.push(function(modelValue) {
					var permutation = itertools.computeNthPermutation(scope.partitions.length, modelValue);

					return permutation.map(function(index) { return scope.partitions[index]; });
				});
			}
		};
	})


	.directive('partitionFilter', function(itertools) {

		// @FIXME This was also there.
		// scope.elementsById = {};

		// scope.forms.forEach(function(form) {
		// 	form.elements.forEach(function(element) {
		// 		scope.elementsById[element.id] = element;
		// 	});
		// });

		// @FIXME Why the fuck did I not do that inside partition-filter directive?
		// it's trying to remove filter that are full, but why there?

		// for (var symbolName in $scope.planning.parameters) {
		// 	var parameter = $scope.planning.parameters[symbolName],
		// 		partitions = $scope.elementsById[parameter.elementId].partitions,
		// 		numPartitions = partitions.length;

		// 	for (var i = 0; i < numPartitions; ++i)
		// 		// Remove filters that include all elements to make the project's JSON smaller
		// 		// They will be restored when editing.
		// 		if (parameter.filter[partitions[i].id].length == partitions[i].elements.length)
		// 			delete parameter.filter[partitions[i].id];
		// }


		// @FIXME same as before, why the fuck is that in the indicatorComputation directive?
		// This only plays with filters.

		// Watch computation.parameters to ensure that filters are valid.
		// var paramWatch = scope.$watch('computation.parameters', function() {
		// 	for (var symbolName in scope.computation.parameters) {
		// 		var parameter = scope.computation.parameters[symbolName];

		// 		// Having a null elementId might always mean that filter is undefined...
		// 		if (!parameter.elementId)
		// 			parameter.filter = {};

		// 		else {
		// 			var partitions = scope.elementsById[parameter.elementId].partitions,
		// 				numPartitions = partitions.length;

		// 			// Remove partitions in the filter that are not from this element
		// 			for (var partitionId in parameter.filter)
		// 				if (!partitions.find(function(e) { return e.id == partitionId; }))
		// 					delete parameter.filter[partitionId];

		// 			// Add missing partitions
		// 			for (var i = 0; i < numPartitions; ++i)
		// 				if (!parameter.filter[partitions[i].id])
		// 					parameter.filter[partitions[i].id] = partitions[i].elements.pluck('id')
		// 		}
		// 	}
		// }, true);

		var model2view = function(model, partition) {
			if (model.length == partition.elements.length)
				return ['all'];
			
			// retrieve all groups that are in the list.
			var selectedGroups = partition.groups.filter(function(group) {
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

		var view2model = function(view, partition) {
			var model = {};

			view.forEach(function(id) {
				if (id == 'all')
					partition.elements.forEach(function(e) { model[e.id] = true; });
				
				else {
					var group = partition.groups.find(function(g) { return g.id == id; });
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
			scope: {}, // isolate scope
			templateUrl: 'partials/_forms/partition-filter.html',
			link: function(scope, element, attributes, ngModelController) {
				// the parameter need to be evaluated in the parent scope (because we use an isolated scope).
				var partition = scope.$parent.$eval(attributes.partition);

				var allSelectableElements = [{id: 'all', name: 'Tous les éléments'}].concat(partition.groups.concat(partition.elements));

				scope.id = Math.random().toString().substring(2);
				// scope.selectableElements = allSelectableElements;
				scope.container = {};
				
				ngModelController.$formatters.push(function(modelValue) {
					return model2view(modelValue, partition);
				});

				ngModelController.$parsers.push(function(viewValue) {
					return view2model(viewValue, partition);
				});

				ngModelController.$render = function() {
					scope.container.partitionElementIds = ngModelController.$viewValue;
				};

				scope.$watch('container.partitionElementIds', function(partitionElementIds) {
					scope.container.partitionElementIds = model2view(view2model(partitionElementIds, partition), partition);
					ngModelController.$setViewValue(partitionElementIds);

					scope.selectableElements = allSelectableElements.filter(function() {
						return true;
						/// FIXME
					});

				}, true)
			}
		}
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

		var dataOptions = {type: 'numeric'};

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

		return {
			restrict: 'E',
			require: 'ngModel',
			templateUrl: "partials/_forms/indicator-computation.html",
			scope: {
				forms: '='
			},
			link: function(scope, element, attributes, ngModelController) {

				ngModelController.$parsers.push(function(modelValue) {
					// Discover type of indicator from the formula.
					var type;
					if (modelValue.formula === '100 * numerator / denominator + "%"')
						type = 'percentage';
					else if (modelValue.formula === '1000 * numerator / denominator + "‰"')
						type = 'permille';
					else if (modelValue.formula === 'copied_value')
						type = 'copy';
					else
						type = 'formula';

					// Return both.
					return {type: type, modelValue: modelValue};
				});

				ngModelController.$formatters.push(function(viewValue) {
					return viewValue.modelValue;
				});

				ngModelController.$render = function() {
					$scope.computationType = viewValue.type;
					$scope.computation = viewValue.modelValue;
				};

				scope.$watch('computationType', function(computationType) {
					if (computationType === 'percentage')
						scope.computation.formula = '100 * numerator / denominator + "%"';
					else if (computationType === 'permille')
						scope.computation.formula = '1000 * numerator / denominator + "‰"';
					else if (computationType === 'copy')
						scope.computation.formula = 'copied_value';
				});

				// Build possible variables and filters.
				scope.selectElements = []
				scope.forms.forEach(function(form) {
					form.elements.forEach(function(element) {
						scope.selectElements.push({id: element.id, name: element.name, group: form.name});
					});
				});
				
				var formulaWatch = scope.$watch('computation.formula', function(formula) {
					var newSymbols, oldSymbols = Object.keys(scope.computation.parameters).sort();
					try { newSymbols = Parser.parse(scope.computation.formula).variables().sort(); }
					catch (e) { newSymbols = []; }

					if (!angular.equals(newSymbols, oldSymbols)) {
						var removedSymbols = oldSymbols.filter(function(s) { return newSymbols.indexOf(s) === -1; }),
							addedSymbols   = newSymbols.filter(function(s) { return oldSymbols.indexOf(s) === -1; });

						// Remove old symbols from formula
						removedSymbols.forEach(function(s) { delete scope.computation.parameters[s]; });

						// Add new symbols to formula
						addedSymbols.forEach(function(s) {
							scope.computation.parameters[s] = {elementId: null, filter: {}};
						});
					}
				});

			}
		};
	});
