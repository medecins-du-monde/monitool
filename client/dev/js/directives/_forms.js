"use strict";

function isEmpty(value) {
	return angular.isUndefined(value) || value === '' || value === null || value !== value;
};

angular.module('monitool.directives.form', [])

	.directive('forbiddenValues', function() {
		return {
			require: 'ngModel',
			link: function($scope, element, attributes, ngModelController) {
				ngModelController.$validators.forbiddenValues = function(modelValue, viewValue) {
					var values = $scope.$eval(attributes.forbiddenValues);
					return values.indexOf(viewValue) === -1;
				};
			}
		};
	})

	.directive('uiRequired', function() {
		return {
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				ctrl.$validators.required = function(modelValue, viewValue) {
					return !((viewValue && viewValue.length === 0 || false) && attrs.uiRequired === 'true');
				};

				attrs.$observe('uiRequired', function() {
					ctrl.$setValidity('required', !(attrs.uiRequired === 'true' && ctrl.$viewValue && ctrl.$viewValue.length === 0));
				});
			}
		};
	})

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
	
	.directive('autoResize', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, element, attributes) {

				var resize = function() {
					element[0].style.height = '1px';
					var newHeight = Math.max(24, element[0].scrollHeight + 3);

					element[0].style.height = newHeight + "px";
				};

				$scope.$watch(attributes.ngModel, function(newValue) {
					resize();
				});

				element.on("blur", resize);
				element.on("keyup", resize);
				element.on("change", resize);
			}
		};
	})

	
	.directive('fullHeight', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, element, attributes) {

				var resize = function() {
					// Compute text height
					element[0].style.height = '1px';
					var textHeight = Math.max(24, element[0].scrollHeight + 3);

					// Compute parent height
					var parentHeight = element[0].parentNode.scrollHeight;
					element[0].style.height = Math.max(textHeight, parentHeight) + "px";
				};

				$scope.$watch(attributes.ngModel, function(newValue, oldValue) {
					if (oldValue != newValue)
						resize();
				});

				setTimeout(resize, 0)

				element.on("blur", resize);
				element.on("keyup", resize);
				element.on("change", resize);
			}
		};
	})

	.directive('optionalDate', function() {
		return {
			restrict: 'E',
			require: 'ngModel',
			templateUrl: 'partials/_forms/optional-date.html',
			scope: {default:'=default'},
			link: function($scope, element, attributes, ngModelController) {

				ngModelController.$formatters.push(function(modelValue) {
					if (modelValue === null)
						return {specifyDate: false, chosenDate: $scope.default};
					else
						return {specifyDate: true, chosenDate: modelValue};
				});

				// We render using more ng-models and bindings, which make it a bit strange.
				// We should simply update the form values manually.
				ngModelController.$render = function() {
					$scope.chosenDate = ngModelController.$viewValue.chosenDate;
					$scope.specifyDate = ngModelController.$viewValue.specifyDate;
				};

				// if specifyDate change, we need to update the view value.
				$scope.$watchGroup(['specifyDate', 'chosenDate'], function() {
					if ($scope.specifyDate)
						ngModelController.$setViewValue({specifyDate: true, chosenDate: $scope.chosenDate});

					else {
						$scope.chosenDate = $scope.default;
						ngModelController.$setViewValue({specifyDate: false, chosenDate: $scope.default});
					}
				});

				ngModelController.$parsers.push(function(viewValue) {
					return viewValue.specifyDate ? viewValue.chosenDate : null;
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
			link: function($scope, element, attributes, ngModelController) {

				ngModelController.$formatters.push(function(modelValue) {
					if (modelValue === null)
						return {specifyValue: false, chosenValue: $scope.default};
					else
						return {specifyValue: true, chosenValue: modelValue};
				});

				// We render using more ng-models and bindings, which make it a bit strange.
				// We should simply update the form values manually.
				ngModelController.$render = function() {
					$scope.chosenValue = ngModelController.$viewValue.chosenValue;
					$scope.specifyValue = ngModelController.$viewValue.specifyValue;
				};

				// if specifyValue change, we need to update the view value.
				$scope.$watchGroup(['specifyValue', 'chosenValue'], function() {
					if ($scope.specifyValue)
						ngModelController.$setViewValue({specifyValue: true, chosenValue: $scope.chosenValue});

					else {
						$scope.chosenValue = $scope.default;
						ngModelController.$setViewValue({specifyValue: false, chosenValue: $scope.default});
					}
				});

				ngModelController.$parsers.push(function(viewValue) {
					return viewValue.specifyValue ? viewValue.chosenValue : null;
				});
			}
		}
	})
	
	.directive('partitionFilter', function() {

		var isSubset = function(superset, subset) {
			return subset.filter(function(element) {
				return superset.indexOf(element) !== -1;
			}).length == subset.length;
		};

		var model2view = function(model, partition) {
			if (model.length == partition.elements.length)
				return ['all'];
			
			// retrieve all groups that are in the list.
			var selectedGroups = partition.groups.filter(function(group) {
				return isSubset(model, group.members);
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
			restrict: "EA",
			require: "ngModel",
			scope: {}, // isolate scope
			template: 
				'<div class="input-group">' + 
					'<span class="input-group-addon"><i class="fa fa-filter fa-fw"></i></span>' + 
					'<ui-select id="{{id}}" name="{{id}}" multiple ng-model="container.partitionElementIds" theme="bootstrap">' +
						'<ui-select-match placeholder="Aucun élément selectionné">{{$item.name}}</ui-select-match>' +
						'<ui-select-choices repeat="filter.id as filter in selectableElements">' +
							'<i class="fa fa-arrow-circle-right" ng-if="filter.id == \'all\'"></i> ' + 
							'<i class="fa fa-arrow-circle-o-right" ng-if="filter.members"></i> ' + 
							'{{filter.name}}' +
						'</ui-select-choices>' +
					'</ui-select>' +
				'</div>',

			link: function($scope, element, attributes, ngModelController) {
				// the parameter need to be evaluated in the parent scope (because we use an isolated scope).
				var partition = $scope.$parent.$eval(attributes.partition);

				var allSelectableElements = [{id: 'all', name: 'Tous les éléments'}].concat(partition.groups.concat(partition.elements));

				$scope.id = Math.random().toString().substring(2);
				// $scope.selectableElements = allSelectableElements;
				$scope.container = {};
				
				ngModelController.$formatters.push(function(modelValue) {
					return model2view(modelValue, partition);
				});

				ngModelController.$parsers.push(function(viewValue) {
					return view2model(viewValue, partition);
				});

				ngModelController.$render = function() {
					$scope.container.partitionElementIds = ngModelController.$viewValue;
				};

				$scope.$watch('container.partitionElementIds', function(partitionElementIds) {
					$scope.container.partitionElementIds = model2view(view2model(partitionElementIds, partition), partition);
					ngModelController.$setViewValue(partitionElementIds);

					$scope.selectableElements = allSelectableElements.filter(function() {
						return true;
						/// FIXME
					});

				}, true)
			}
		}
	})


	///////////////////////////
	// FIXME
	// This directive needs to be rewriten at once.
	// It has survived changing multiple times how partitions works, by adding punctual patches
	// but the same behaviour could be implemented in a way shorter/faster/more understandable way. 
	///////////////////////////

	.directive('inputGrid', function(itertools) {
			var headerOptions = {
				readOnly: true,
				renderer: function(instance, td, row, col, prop, value, cellProperties) {
					Handsontable.renderers.TextRenderer.apply(this, arguments);
					td.style.color = 'black';
				    td.style.background = '#eee';
				}
			},
			dataOptions = {type: 'numeric'},
			dataReadOnlyOptions = {type: 'numeric', readOnly: true};

		return {
			restrict: 'E',
			require: 'ngModel',
			template: "<div></div>",
			link: function($scope, element, attributes, ngModelController) {
				$scope.$watchGroup([attributes.rotation, attributes.offset], function(newValue, oldValue) {
					// When the partition definition changes, we need to trigger a full parse + redraw.
					// The AngularJS API is missing the method so we use a side-effect to do it.
					// 
					// http://stackoverflow.com/questions/25436691/trigger-ng-model-formatters-to-run-programatically

					ngModelController.$modelValue = "ⓗⓤⓖⓔ ⓗⓐⓒⓚ"
				});

				ngModelController.$formatters.push(function(modelValue) {
					var partitions = $scope.$eval(attributes.partitions),
						offset     = $scope.$eval(attributes.offset) + 1,
						rotation   = $scope.$eval(attributes.rotation);

					// Special case, only one field.
					if (partitions.length == 0)
						return [[modelValue[0]]];

					// Special case, only one row.
					if (partitions.length == 1)
						return partitions[0].elements.map(function(p, index) { return [p.name, modelValue[index]]; });

					// FIXME: cheat
					partitions.forEach(function(partition, partitionIndex) {
						partition.elements.forEach(function(partitionElement, partitionElementIndex) {
							partitionElement.partitionIndex = partitionIndex;
							partitionElement.partitionElementIndex = partitionElementIndex;
						});
					});

					// General case.
					var permutation      = itertools.computeNthPermutation(partitions.length, rotation),
						topPartitionIds  = permutation.slice(0, offset),
						leftPartitionIds = permutation.slice(offset);

					var totalCols = topPartitionIds.reduce(function(memo, partitionId) { return memo * partitions[partitionId].elements.length; }, 1),
						totalRows = leftPartitionIds.reduce(function(memo, partitionId) { return memo * partitions[partitionId].elements.length; }, 1),
						colspan   = totalCols, // current colspan is total number of columns.
						numCols   = 1;

					// Create top header rows.
					var topHeaderRows = topPartitionIds.map(function(topPartitionId) {
						// Adapt colspan and number of columns
						colspan /= partitions[topPartitionId].elements.length; 
						numCols *= partitions[topPartitionId].elements.length;

						var i, row = [];

						// push empty cells to fit the line headers
						for (i = 0; i < leftPartitionIds.length; ++i)
							row.push('');

						// push headers from the partition
						for (var k = 0; k < numCols; ++k) {
							row.push(partitions[topPartitionId].elements[k % partitions[topPartitionId].elements.length].name);

							for (i = 0; i < colspan - 1; ++i)
								row.push('');
						}

						return row;
					});

					// Create WTF IS THIS????
					var rowspans = [];
					var rowspan = totalRows;
					for (var i = 0; i < leftPartitionIds.length; ++i) {
						rowspan /= partitions[leftPartitionIds[i]].elements.length;
						rowspans[i] = rowspan;
					}

					// Create data rows
					var contentRows = itertools.product(leftPartitionIds.map(function(id) { return partitions[id].elements; })).map(function(curLeftPartitionElements, contentRowIndex) {
						var leftHeaderCols = curLeftPartitionElements.map(function(p, titleColIndex) {
							return contentRowIndex % rowspans[titleColIndex] == 0 ? p.name : '';
						});

						var dataCols = itertools.product(topPartitionIds.map(function(id) { return partitions[id].elements; })).map(function(curTopPartitionElements) {
							var partitionElements = curLeftPartitionElements.concat(curTopPartitionElements).sort(function(pe1, pe2) { return pe1.partitionIndex - pe2.partitionIndex; });

							var fieldIndex = 0;
							partitionElements.forEach(function(pe) {
								fieldIndex = fieldIndex * partitions[pe.partitionIndex].elements.length + pe.partitionElementIndex;
							});

							return modelValue[fieldIndex];
						});

						return leftHeaderCols.concat(dataCols)
					});

					// FIXME: repare cheating.
					partitions.forEach(function(partition, partitionIndex) {
						partition.elements.forEach(function(partitionElement, partitionElementIndex) {
							delete partitionElement.partitionIndex;
							delete partitionElement.partitionElementIndex;
						});
					});

					return topHeaderRows.concat(contentRows);
				});

				ngModelController.$parsers.push(function(viewValue) {
					var partitions = $scope.$eval(attributes.partitions),
						offset     = $scope.$eval(attributes.offset) + 1,
						rotation   = $scope.$eval(attributes.rotation);

					// Special case, only one field.
					if (partitions.length == 0)
						return [viewValue[0][0]];

					// Special case, only one row.
					if (partitions.length == 1)
						return viewValue.map(function(row) { return row[1]; });


					// FIXME: cheat
					partitions.forEach(function(partition, partitionIndex) {
						partition.elements.forEach(function(partitionElement, partitionElementIndex) {
							partitionElement.partitionIndex = partitionIndex;
							partitionElement.partitionElementIndex = partitionElementIndex;
						});
					});

					// General case.
					var numFields = 1;
					partitions.forEach(function(partition) { numFields *= partition.elements.length; });

					var modelValue       = new Array(numFields),
						permutation      = itertools.computeNthPermutation(partitions.length, rotation),
						topPartitions    = permutation.slice(0, offset).map(function(id) { return partitions[id].elements; }),
						leftPartitions   = permutation.slice(offset).map(function(id) { return partitions[id].elements; });

					itertools.product(leftPartitions).map(function(curLeftPartition, rowIndex) {
						itertools.product(topPartitions).forEach(function(curTopPartition, colIndex) {
							var partitionElements = curLeftPartition.concat(curTopPartition).sort(function(pe1, pe2) { return pe1.partitionIndex - pe2.partitionIndex; });
							var fieldIndex = 0;
							partitionElements.forEach(function(pe) {
								fieldIndex = fieldIndex * partitions[pe.partitionIndex].elements.length + pe.partitionElementIndex;
							});

							modelValue[fieldIndex] = viewValue[rowIndex + topPartitions.length][colIndex + leftPartitions.length];
						});
					});

					// FIXME: repare cheating.
					partitions.forEach(function(partition, partitionIndex) {
						partition.elements.forEach(function(partitionElement, partitionElementIndex) {
							delete partitionElement.partitionIndex;
							delete partitionElement.partitionElementIndex;
						});
					});

					return modelValue;
				});

				ngModelController.$render = function() {
					var partitions = $scope.$eval(attributes.partitions),
						offset     = $scope.$eval(attributes.offset) + 1,
						rotation   = $scope.$eval(attributes.rotation);

					if (partitions.length == 0)
						hotTable.updateSettings({ maxCols: 1, maxRows: 1, cells: function(row, col, prop) { return ($scope.canEdit ? dataOptions : dataReadOnlyOptions); }});

					else if (partitions.length == 1)
						hotTable.updateSettings({ maxCols: 2, maxRows: partitions[0].elements.length, cells: function(row, col, prop) { return col == 1 ? ($scope.canEdit ? dataOptions : dataReadOnlyOptions) : headerOptions; }});

					else {
						// Split partitions in cols and rows.
						var permutation      = itertools.computeNthPermutation(partitions.length, rotation),
							topPartitionIds  = permutation.slice(0, offset),
							leftPartitionIds = permutation.slice(offset);

						var totalCols = topPartitionIds.reduce(function(memo, partitionId) { return memo * partitions[partitionId].elements.length; }, 1),
							totalRows = leftPartitionIds.reduce(function(memo, partitionId) { return memo * partitions[partitionId].elements.length; }, 1);

						hotTable.updateSettings({
							maxCols: totalCols + leftPartitionIds.length,
							maxRows: totalRows + topPartitionIds.length,
							cells: function(row, col, prop) {
								return row < topPartitionIds.length || col < leftPartitionIds.length ? headerOptions : ($scope.canEdit ? dataOptions : dataReadOnlyOptions);
							}
						});
					}

					hotTable.loadData(ngModelController.$viewValue);
				};

				var afterChange = function(changes, action) {
					if (action != 'edit' && action != 'paste')
						return

					changes.forEach(function(change) {
						var x   = change[0],
							y   = change[1],
							val = change[3];

						if (typeof val != 'number') {
							try { hotTable.setDataAtCell(x, y, Parser.evaluate(val, {})); }
							catch (e) { }
						}
					});

					ngModelController.$setViewValue(hotTable.getData());
				};

				// I have no idea why, but settings colWidths to any string keeps all columns the same width
				var hotTable = new Handsontable(element[0].firstElementChild, {
					stretchH: "all",
					data: null,
					colWidths: 'xxx',
					afterChange: afterChange
				});
			}
		}
	})
