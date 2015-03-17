"use strict";

angular
	.module('monitool.directives.projectForm', [])

	/**
	 * This service is full of utils to help with the directives just after it.
	 * It is only used on this file.
	 * Don't bother reading unless it is buggy.
	 */
	.factory('formEditUtils', function() {
		var fns = {
			forms: {
				getConcurrents: function(allForms, currentForm) {
					return allForms.filter(function(otherForm) {
						var otherIsAfter  = currentForm.end.getTime() <= otherForm.start.getTime(),
							otherIsBefore = currentForm.start.getTime() >= otherForm.end.getTime();
						return currentForm.id !== otherForm.id && !(otherIsBefore || otherIsAfter);
					});
				},

				getKeepableFields: function(currentForm, concurrentForms) {
					return currentForm.fields.filter(function(field) {
						return concurrentForms.every(function(concurrentForm) {
							return concurrentForm.fields.every(function(otherField) {
								return field.indicatorId !== otherField.indicatorId;
							});
						});
					});
				},

				getAddableIndicatorIds: function(projectIndicatorIds, allForms) {
					return projectIndicatorIds.filter(function(indicatorId) {
						return allForms.every(function(form) {
							return form.fields.every(function(field) { return field.indicatorId !== indicatorId; });
						});
					});
				},
			},

			fields: {
				getFlat: function(fields, indicatorsById) {
					var flatFields = [];
					fields.forEach(function(field) {
						flatFields.push({
							indent: 0,
							indicator: indicatorsById[field.indicatorId],
							field: field
						});

						if (field.type === 'formula')
							for (var key in field.parameters)
								flatFields.push({
									indent: 1,
									indicator: indicatorsById[field.indicatorId].formulas[field.formulaId].parameters[key],
									field: field.parameters[key]
								});
					});

					return flatFields;

					// var getFieldsRec = function(field, path, indent) {
					// 	var result = [];

					// 	for (var key in field.parameters) {
					// 		var subField = field.parameters[key];
					// 		result.push({indent: indent, path: path + '.' + key, field: subField});

					// 		Array.prototype.push.apply(result, getFieldsRec(subField, path + '.' + key, indent + 1));
					// 	}

					// 	return result;
					// };

					// var flatFields = [];

					// fields.forEach(function(field) {
					// 	flatFields.push({indent: 0, path: field.indicatorId, field: field});
					// 	Array.prototype.push.apply(flatFields, getFieldsRec(field, field.indicatorId, 1))
					// });

					// return flatFields;
				}
			},

			sources: {
				createList: function(indicator, rawData) {
					var typeOptions = [];

					for (var formulaId in indicator.formulas)
						typeOptions.push({
							name: indicator.formulas[formulaId].name,
							group: "Formulas",
							meta: { type: "formula", id: formulaId, formula: indicator.formulas[formulaId] }
						});

					rawData.forEach(function(section) {
						section.elements.forEach(function(element) {
							typeOptions.push({
								name: element.name,
								group: section.name,
								meta: { type: "raw", id: element.id, element: element, filter: {} }
							});
						});
					});

					return typeOptions;
				}
			},

			filters: {
				createFullArray: function(element) {
					if (element.partition1.length && element.partition2.length)
						return fns.filters.two.createFullArray(element);
					else if (element.partition1.length)
						return fns.filters.one.createFullArray(element);
					else
						return [];
				},
				arrayToHash: function(array, element) {
					if (element.partition1.length && element.partition2.length)
						return fns.filters.two.arrayToHash(array, element);
					else if (element.partition1.length)
						return fns.filters.one.arrayToHash(array, element);
					else
						return [];
				},
				hashToArray: function(hash, element) {
					if (element.partition1.length && element.partition2.length)
						return fns.filters.two.hashToArray(hash, element);
					else if (element.partition1.length)
						return fns.filters.one.hashToArray(hash, element);
					else
						return [];
				},

				one: {
					createFullArray: function(element) {
						return element.partition1.map(function(p) { return p.id; });
					},

					arrayToHash: function(array, element) {
						var hash = {};
						element.partition1.forEach(function(p1) { hash[p1.id] = false; });
						array.forEach(function(i) { hash[i] = true; });
						return hash;
					},
					hashToArray: function(hash, element) {
						var array = [], p1, p2;
						for (p1 in hash)
							if (hash[p1])
								array.push(p1);
						return array;
					},

					isAllTrue: function(hash, element) {
						return !element.partition1.some(function(p) { return !hash[p.id]; });
					},
					setAll: function(hash, element, value) {
						element.partition1.forEach(function(p) { hash[p.id] = value; });
					},
				},

				two: {
					createFullArray: function(element) {
						var r = [];
						element.partition1.forEach(function(p1) {
							element.partition2.forEach(function(p2) {
								r.push([p1.id, p2.id]);
							})
						})
						return r;
					},
					arrayToHash: function(array, element) {
						var hash = {};
						element.partition1.forEach(function(p1) {
							hash[p1.id] = {};
							element.partition2.forEach(function(p2) {
								hash[p1.id][p2.id] = false;
							});
						});

						array.forEach(function(i) {
							hash[i[0]][i[1]] = true;
						});
						return hash;
					},
					hashToArray: function(hash, element) {
						var array = [], p1, p2;
						for (p1 in hash)
							for (p2 in hash[p1])
								if (hash[p1][p2])
									array.push([p1, p2]);
						return array;
					},

					isAllTrue: function(hash, element) {
						return !element.partition1.some(function(p1) {
							return element.partition2.some(function(p2) {
								return !hash[p1.id][p2.id];
							});
						});
					},
					setAll: function(hash, element, value) {
						element.partition1.forEach(function(p1) {
							element.partition2.forEach(function(p2) {
								hash[p1.id][p2.id] = value;
							});
						});
					},
					invert: function(hash) {
						var newHash = {};
						for (var p1 in hash)
							for (var p2 in hash) {
								if (!newHash[p2])
									newHash[p2] = {};
								newHash[p2][p1] = hash[p1][p2];
							}
						return newHash;
					},
					isRowTrue: function(hash, rowId, element) {
						return !element.partition2.some(function(p2) {
							return !hash[rowId][p2.id];
						})
					},
					setRow: function(hash, rowId, element, value) {
						element.partition2.forEach(function(p2) {
							hash[rowId][p2.id] = value;
						});
					},
					isColTrue: function(hash, colId, element) {
						return !element.partition1.some(function(p1) {
							return !hash[p1.id][colId];
						});
					},
					setCol: function(hash, colId, element, value) {
						element.partition1.forEach(function(p1) {
							hash[p1.id][colId] = value;
						});
					},
					
				}
			}
		};

		return fns;
	})
	
	/**
	 * This directive controls the HTML table where the user can describe the raw data that comes from the NHIS, etc...
	 */
	.directive('formEditRawData', function() {
		return {
			restrict: "AE",
			templateUrl: "partials/_directives/form-edit-raw-data.html",
			scope: {
				'rawData': '='
			},
			link: function($scope, element) {
				$scope.newSection = function(target) {
					target.push({id: makeUUID(), name: "", elements: []});
				};

				$scope.newVariable = function(target) {
					target.push({id: makeUUID(), name: "", partition1: [], partition2: []});
				};

				$scope.newPartition = function(target) {
					target.push({id: makeUUID(), name: ""});
				};

				$scope.remove = function(item, target) {
					var index = target.findIndex(function(arrItem) {
						return item.id === arrItem.id;
					});

					if (index !== -1)
						target.splice(index, 1)
				};

			}
		}
	})


	/**
	 * This directive controls the HTML table where the user can describe how to compute the project's indicators from the raw data.
	 * It's only role is to help formatting the table by flattening the tree structure to an array (so that we can iterate on those and fill the table).
	 */
	.directive('formEditFields', function(formEditUtils) {
		return {
			restrict: "AE",
			scope: true,
			templateUrl: 'partials/_directives/form-edit-fields.html',
			link: function($scope) {
				// watch fields in the form. When those change, recompute the flatFields list
				// so that we can render the html table.
				$scope.$watch('form.fields', function(fields) {
					$scope.flatFields = formEditUtils.fields.getFlat(fields, $scope.indicatorsById);
				}, true);

				// watch begin and end date.
				// When they change, we update the list of
				// - indicators in form.fields (some of them may become forbidden to compute)
				// - indicators in addable indicators.
				$scope.$watch("[form.useProjectStart, form.start, form.useProjectEnd, form.end]", function(newValue, oldValue) {
					// Retrieve start / end dates.
					var begin = $scope.form.useProjectStart ? $scope.project.begin : $scope.form.start,
						end   = $scope.form.useProjectEnd ? $scope.project.end : $scope.form.end;

					// When begin and end change, we need to update the list of indicators we can keep and add.
					// the user cannot choose an indicator which is already collected in the same period.
					var concurrentForms = formEditUtils.forms.getConcurrents($scope.project.dataCollection, $scope.form),
						keepableFields  = formEditUtils.forms.getKeepableFields($scope.form, concurrentForms);

					if (keepableFields.length !== $scope.form.fields.length) {
						if (confirm('Indicators will be removed. Are you sure you want to change this dates?'))
							// remove the fields that are causing problems
							$scope.form.fields = keepableFields;
						else {
							// restore former dates.
							$scope.form.useProjectStart = oldValue[0];
							$scope.form.start = oldValue[1];
							$scope.form.useProjectEnd = oldValue[2];
							$scope.form.end = oldValue[3];
						}
					}

					// Update addable indicators
					var allForms            = concurrentForms.concat([$scope.form]),
						projectIndicatorIds = Object.keys($scope.project.indicators),
						addableIndicatorIds = formEditUtils.forms.getAddableIndicatorIds(projectIndicatorIds, allForms);

					$scope.addableIndicators = addableIndicatorIds.map(function(indicatorId) { return $scope.indicatorsById[indicatorId]; });
				}, true);


				$scope.add = function() {
					if ($scope.newIndicatorId) {
						$scope.form.fields.push({indicatorId: $scope.newIndicatorId});
						delete $scope.newIndicatorId; // reset html select value.
					}

					// Update addable indicators
					var concurrentForms     = formEditUtils.forms.getConcurrents($scope.project.dataCollection, $scope.form),
						allForms            = concurrentForms.concat([$scope.form]),
						projectIndicatorIds = Object.keys($scope.project.indicators),
						addableIndicatorIds = formEditUtils.forms.getAddableIndicatorIds(projectIndicatorIds, allForms);

					$scope.addableIndicators = addableIndicatorIds.map(function(indicatorId) { return $scope.indicatorsById[indicatorId]; });
				};
			}
		}
	})

	/**
	 * This directive controls one row the HTML table where the user can describe how to compute the project's indicators from the raw data.
	 */
	 .directive('formEditField', function(formEditUtils) {
		return {
			restrict: "AE",
			templateUrl: "partials/_directives/form-edit-field.html",
			scope: {
				'field': '=',
				'indicator': '=',
				'rawData': '='
			},
			link: function($scope) {
				// Init
				// We need a watch because available sources may change if user goes between rawdata and fields tabs
				$scope.$watch('rawData', function() {
					$scope.sources = formEditUtils.sources.createList($scope.indicator, $scope.rawData);
					$scope.source = $scope.sources.find(function(potentialSource) {
						return potentialSource.meta.id === $scope.field.rawId
							|| potentialSource.meta.id === $scope.field.formulaId;
					});
				}, true);

				// On user input
				$scope.$watch('source', function(source, oldSource) {
					// When no source is selected, there is no point in continuing
					if (!source)
						return;

					// Configure the field object depending on what was selected.
					$scope.field.type = source.meta.type;
					
					if ($scope.field.type === 'raw') {
						// delete formula params on raws
						delete $scope.field.formulaId;
						delete $scope.field.parameters;
						
						$scope.field.rawId = source.meta.id;
						$scope.field.filter = formEditUtils.filters.createFullArray(source.meta.element);
					}
					else if ($scope.field.type === 'formula') {
						// delete raw params on formulas
						delete $scope.field.rawId;
						delete $scope.field.filter;

						$scope.field.formulaId = source.meta.id;
						$scope.field.parameters = {};
						for (var key in $scope.indicator.formulas[source.meta.id].parameters)
							$scope.field.parameters[key] = {};
					}
				}, true);
			}
		}
	})

	/**
	 * This directive controls a filter (used to extract a partial sum from a partitioned raw data
	 */
	 .directive('formEditFilter', function(formEditUtils) {
		return {
			restrict: "AE",
			templateUrl: "partials/_directives/form-edit-filter.html",
			scope: {
				'element': '=',
				'arrayFilter': '=value'
			},
			link: function($scope) {
				$scope.$watch('element', function() {
					if ($scope.element && $scope.arrayFilter)
						$scope.filter = formEditUtils.filters.arrayToHash($scope.arrayFilter, $scope.element);
				});

				$scope.$watch('filter', function(filter) {
					// Replace the whole array without breaking the reference.
					Array.prototype.splice.apply(
						$scope.arrayFilter,
						[0, $scope.arrayFilter.length].concat(formEditUtils.filters.hashToArray($scope.filter, $scope.element))
					);
				}, true);

				$scope.togglePartition2 = function(partitionType, partitionId) {
					var isTrue;
					if (partitionType === 0) {
						isTrue = formEditUtils.filters.two.isRowTrue($scope.filter, partitionId, $scope.element);
						formEditUtils.filters.two.setRow($scope.filter, partitionId, $scope.element, !isTrue);
					}
					else {
						isTrue = formEditUtils.filters.two.isColTrue($scope.filter, partitionId, $scope.element);
						formEditUtils.filters.two.setCol($scope.filter, partitionId, $scope.element, !isTrue);
					}
				};

				$scope.toggleAll1 = function() {
					var isAllTrue = formEditUtils.filters.one.isAllTrue($scope.filter, $scope.element);
					formEditUtils.filters.one.setAll($scope.filter, $scope.element, !isAllTrue);
				};

				$scope.toggleAll2 = function() {
					var isAllTrue = formEditUtils.filters.two.isAllTrue($scope.filter, $scope.element);
					formEditUtils.filters.two.setAll($scope.filter, $scope.element, !isAllTrue);
				};
			}
		}
	});
