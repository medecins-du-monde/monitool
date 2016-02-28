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
				$scope.$watchGroup([attributes.partitions, attributes.offset], function(newValue, oldValue) {
					// When the partition definition changes, we need to trigger a full parse + redraw.
					// The AngularJS API is missing the method so we use a side-effect to do it.
					// 
					// http://stackoverflow.com/questions/25436691/trigger-ng-model-formatters-to-run-programatically

					ngModelController.$modelValue = "ⓗⓤⓖⓔ ⓗⓐⓒⓚ"
				});

				ngModelController.$formatters.push(function(modelValue) {
					var partitions = $scope.$eval(attributes.partitions),
						offset = $scope.$eval(attributes.offset) + 1;

					// Special case, only one field.
					if (partitions.length == 0)
						return [[modelValue['']]];

					// Special case, only one row.
					if (partitions.length == 1)
						return partitions[0].map(function(p) { return [p.name, modelValue[p.id]]; });

					// General case.
					var topPartitions  = partitions.slice(0, offset),
						leftPartitions = partitions.slice(offset);

					var totalCols = topPartitions.reduce(function(memo, item) { return memo * item.length; }, 1),
						totalRows = leftPartitions.reduce(function(memo, item) { return memo * item.length; }, 1),
						colspan   = totalCols, // current colspan is total number of columns.
						numCols   = 1;

					// Create top header rows.
					var topHeaderRows = topPartitions.map(function(topPartition, topPartitionIndex) {
						// Adapt colspan and number of columns
						colspan /= topPartition.length; 
						numCols *= topPartition.length;

						var i, row = [];

						// push empty cells to fit the line headers
						for (i = 0; i < leftPartitions.length; ++i)
							row.push('');

						// push headers from the partition
						for (var k = 0; k < numCols; ++k) {
							row.push(topPartition[k % topPartition.length].name);
							for (i = 0; i < colspan - 1; ++i)
								row.push('');
						}

						return row;
					});

					// Create WTF IS THIS????
					var rowspans = [];
					var rowspan = totalRows;
					for (var i = 0; i < leftPartitions.length; ++i) {
						rowspan /= leftPartitions[i].length;
						rowspans[i] = rowspan;
					}

					// Create data rows
					var contentRows = itertools.product(leftPartitions).map(function(curLeftPartition, index) {
						var leftHeaderCols = curLeftPartition.map(function(p, index2) {
							return index % rowspans[index2] == 0 ? p.name : '';
						});

						var dataCols = itertools.product(topPartitions).map(function(curTopPartition) {
							var fieldId = curLeftPartition.concat(curTopPartition).map(function(p) { return p.id; }).sort().join('.');
							return modelValue[fieldId];
						});

						return leftHeaderCols.concat(dataCols)
					});

					return topHeaderRows.concat(contentRows);
				});

				ngModelController.$parsers.push(function(viewValue) {
					var partitions = $scope.$eval(attributes.partitions),
						offset = $scope.$eval(attributes.offset) + 1;

					// Special case, only one field.
					if (partitions.length == 0)
						return {'': viewValue[0][0]};

					var modelValue = {};

					// Special case, only one row.
					if (partitions.length == 1) {
						partitions[0].forEach(function(p, rowIndex) { modelValue[p.id] = viewValue[rowIndex][1]; });
						return modelValue;
					}

					// General case.
					var topPartitions  = partitions.slice(0, offset),
						leftPartitions = partitions.slice(offset);

					itertools.product(leftPartitions).map(function(curLeftPartition, rowIndex) {
						itertools.product(topPartitions).forEach(function(curTopPartition, colIndex) {
							var fieldId = curLeftPartition.concat(curTopPartition).map(function(p) { return p.id; }).sort().join('.');
							modelValue[fieldId] = viewValue[rowIndex + topPartitions.length][colIndex + leftPartitions.length];
						});
					});

					return modelValue;
				});

				ngModelController.$render = function() {
					var partitions = $scope.$eval(attributes.partitions),
						offset = $scope.$eval(attributes.offset) + 1;

					if (partitions.length == 0)
						hotTable.updateSettings({ maxCols: 1, maxRows: 1, cells: function(row, col, prop) { return dataOptions; }});
					
					else if (partitions.length == 1)
						hotTable.updateSettings({ maxCols: 2, maxRows: partitions[0].length, cells: function(row, col, prop) { return col == 1 ? dataOptions : headerOptions; }});
					
					else {
						// Split partitions in cols and rows.
						var topPartitions  = partitions.slice(0, offset),
							leftPartitions = partitions.slice(offset);

						var totalCols = topPartitions.reduce(function(memo, item) { return memo * item.length; }, 1),
							totalRows = leftPartitions.reduce(function(memo, item) { return memo * item.length; }, 1);

						hotTable.updateSettings({
							maxCols: totalCols + leftPartitions.length,
							maxRows: totalRows + topPartitions.length,
							cells: function(row, col, prop) {
								return row < topPartitions.length || col < leftPartitions.length ? headerOptions : dataOptions;
							}
						});
					}

					hotTable.loadData(ngModelController.$viewValue);
				};

				var afterChange = function(a, b) {
					if (a && typeof a[0][3] !== 'number') {
						try {
							var value = Parser.evaluate(a[0][3], {});
							hotTable.setDataAtCell(a[0][0], a[0][1], value);
						}
						catch (e) {}
					}
					else if (b == 'edit') {
						ngModelController.$setViewValue(hotTable.getData());
					}
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





