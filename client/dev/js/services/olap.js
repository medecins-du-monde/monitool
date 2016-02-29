"use strict";

/**
 * Incredibly ineficient OLAP cube implementation.
 * No cache, trees, contiguous buffers that could make this fast.
 * It should be good enought for what we need but implement this properly if too slow
 * (or find an implementation on the internet).
 *
 * Also, we should rename methods so that their names make sense to someone that uses olap cubes
 * (facts, measures, dimensions, slice, dice, ... instead of filter, query, etc)
 */
angular
	.module(
		'monitool.services.olap',
		[
			'monitool.services.itertools'
		]
	)

	.factory('Olap', function(itertools) {

		/**
		 * id = "month"
		 * items = ["2010-01", "2010-02", ...]
		 * aggregation = "sum"
		 */
		var Dimension = function(id, name, items, aggregation) {
			this.id = id;
			this.name = name;
			this.items = items;
			this.aggregation = aggregation;
		};

		Dimension.prototype.aggregate = function(elCubes) {
			var newElCube = elCubes[0].clone();
			delete newElCube.dimensionValues[this.id]; // this one we can drop

			var numCubes = elCubes.length, i = 0, result;

			switch (this.aggregation) {
				case "sum":
					result = 0;
					while (i != numCubes) {
						result += elCubes[i].value;
						++i;
					}
					newElCube.value = result;
					break;

				case "average":
					result = 0;
					while (i != numCubes) {
						result += elCubes[i].value;
						++i;
					}
					newElCube.value = result / numCubes;
					break;

				case "highest":
					result = Math.MIN_VALUE;
					while (i != numCubes) {
						if (elCubes[i].value > result)
							result = elCubes[i].value;
						++i;
					}
					newElCube.value = result;
					break;

				case "lowest":
					result = Math.MAX_VALUE;
					while (i != numCubes) {
						if (elCubes[i].value < result)
							result = elCubes[i].value;
						++i;
					}
					newElCube.value = result;
					break;

				case "last":
					newElCube.value = elCubes[elCubes.length - 1].value;
					break;

				default:
					throw new Error('Invalid mode')
			}

			return newElCube;
		};


		/**
		 * dimensions = {month: "2010-01", year: "2010", "partition1": "1d38d1ef-55b8-4959-9552-3dcce1ce2ebb", ...}
		 * value = 45
		 */
		var ElementaryCube = function(dimensionValues, value) {
			this.dimensionValues = dimensionValues;
			this.value = value;
		};

		ElementaryCube.prototype.matchFilter = function(filterValues) {
			for (var dimensionId in filterValues)
				if (!filterValues[dimensionId][this.dimensionValues[dimensionId]])
					return false;

			return true;
		};

		ElementaryCube.prototype.clone = function() {
			var dimValues = {};
			for (var dimensionId in this.dimensionValues)
				dimValues[dimensionId] = this.dimensionValues[dimensionId];

			return new ElementaryCube(dimValues, this.value);
		};



		/**
		 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
		 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
		 * data = [ElementaryCube(...), ElementaryCube(...), ElementaryCube(...), ...]
		 */
		var Cube = function(id, dimensions, elementaryCubes) {
			this.id = id;
			this.dimensions = dimensions;
			this.elementaryCubes = elementaryCubes;

			this._sortCubes();
		};

		Cube.fromProject = function(project, allInputs) {
			// Create all cubes.
			var cubes = {};

			project.forms.forEach(function(form) {
				var inputs = allInputs.filter(function(input) { return input.form == form.id; });

				// Create shared dimension elements.
				var entities = project.entities,
					years    = {},
					quarters = {},
					months   = {},
					weeks    = {},
					days     = {};

				// Create dimensionValues for each input in advance.
				var refDimensionValuesByInput = {};
				inputs.forEach(function(input) {
					var period = moment(input.period);
					var refDimensionValues = {
						year: period.format('YYYY'),
						quarter: period.format('YYYY-[Q]Q'),
						month: period.format('YYYY-MM'),
						week: period.format('YYYY-[W]WW'),
						day: period.format('YYYY-MM-DD'),
						entity: input.entity
					};

					refDimensionValuesByInput[input._id] = refDimensionValues;
					years[refDimensionValues.year] = true;
					quarters[refDimensionValues.quarter] = true;
					months[refDimensionValues.month] = true;
					weeks[refDimensionValues.week] = true;
					days[refDimensionValues.day] = true;
				});

				years    = Object.keys(years).sort().map(function(t) { return {id: t, name: t}; });
				quarters = Object.keys(quarters).sort().map(function(t) { return {id: t, name: t}; });
				months   = Object.keys(months).sort().map(function(t) { return {id: t, name: t}; });
				weeks    = Object.keys(weeks).sort().map(function(t) { return {id: t, name: t}; });
				days     = Object.keys(days).sort().map(function(t) { return {id: t, name: t}; });

				form.elements.forEach(function(element) {
					var numPartitions = element.partitions.length;

					var dimensions = element.partitions.map(function(partition, index) {
						var name = partition.pluck('name').join(' / ');
						if (name.length > 80)
							name = name.substring(0, 80 - 3) + '...';
						return new Dimension('partition' + index, name, partition, 'sum')
					}).concat([
						new Dimension('entity', 'project.entity', entities, element.geoAgg),
						new Dimension('year', 'shared.year', years, element.timeAgg),
						new Dimension('quarter', 'shared.quarter', quarters, element.timeAgg),
						new Dimension('month', 'shared.month', months, element.timeAgg),
						new Dimension('week', 'shared.week', weeks, element.timeAgg),
						new Dimension('day', 'shared.day', days, element.timeAgg)
					]);

					var elementaryCubes = [];
					inputs.forEach(function(input) {
						var refDimensionValues = refDimensionValuesByInput[input._id];

						if (numPartitions > 0) {
							var elCubes = itertools.product(element.partitions).map(function(partition) {
								var dimensionValues = {};

								// clone shared dimensions
								for (var key in refDimensionValues)
									dimensionValues[key] = refDimensionValues[key];

								// add partitions
								for (var i = 0; i < numPartitions; ++i)
									dimensionValues['partition' + i] = partition[i].id;
								
								var value = input.values[element.id][partition.pluck('id').sort().join('.')] || 0;
								return new ElementaryCube(dimensionValues, value);
							});

							// append new cubes
							Array.prototype.push.apply(elementaryCubes, elCubes);
						}
						else {
							elementaryCubes.push(new ElementaryCube(refDimensionValues, input.values[element.id][''] || 0));
						}
					}, this);

					cubes[element.id] = new Cube(element.id, dimensions, elementaryCubes);

				}, this);
			}, this);

			return cubes;
		};

		Cube.prototype._sortCubes = function() {
			var numDimensions = this.dimensions.length;
			var dimensionIndexes = this.dimensions.map(function(dimension) {
				var r = {};
				dimension.items.forEach(function(item, index) { r[item.id] = index; });
				return r;
			});

			// Sort them by their dimension values.
			this.elementaryCubes.sort(function(elCube1, elCube2) {
				// take the first dimension that allow to separate those apart.
				for (var i = 0; i < numDimensions; ++i) {
					var dimension = this.dimensions[i],
						dimensionIndex = dimensionIndexes[i],
						index1 = dimensionIndex[elCube1.dimensionValues[dimension.id]], //dimension.items.findIndex(function(dimItem) { return dimItem.id == elCube1.dimensionValues[dimension.id]; }),
						index2 = dimensionIndex[elCube2.dimensionValues[dimension.id]]; //dimension.items.findIndex(function(dimItem) { return dimItem.id == elCube2.dimensionValues[dimension.id]; });

					if (index1 != index2)
						return index1 - index2;
				}

				// both elements match on all dimensions. This should never happen under normal operation.
				throw new Error('Two elementary cubes were found with the same dimensionValues.');
			}.bind(this));
		};

		Cube.prototype._aggregateCubes = function(elementaryCubes) {
			var numDimensions = this.dimensions.length;

			// group dimension by dimension in reverse order.
			for (var i = numDimensions - 1; i >= 0; --i) {
				var dimension = this.dimensions[i];

				var newCubes = [];
				while (elementaryCubes.length) {
					var start = 0, end = 1;

					while (end < elementaryCubes.length
							&& elementaryCubes[end].dimensionValues[dimension.id] 
							=== elementaryCubes[0].dimensionValues[dimension.id])

						++end;

					var sameDimensionCubes = elementaryCubes.splice(0, end);
					var aggregatedCube = dimension.aggregate(sameDimensionCubes);

					newCubes.push(aggregatedCube);

				}

				elementaryCubes = newCubes;
			}
		}

		/**
		 * dimensions = ['month', 'partition2']
		 * filter = {year: ['2014'], partition1: ["2d31a636-1739-4b77-98a5-bf9b7a080626"]}
		 */
		Cube.prototype.query = function(dimensionIds, filterValues) {
			var fastFilterValues = {};
			for (var dimensionName in filterValues) {
				fastFilterValues[dimensionName] = {};
				filterValues[dimensionName].forEach(function(dimValue) {
					fastFilterValues[dimensionName][dimValue] = true;
				});
			}

			return this._query_fast(dimensionIds, fastFilterValues);
		};


		/**
		 * dimensions = ['month', 'partition2']
		 * filter = {year: {'2014': true}, partition1: {"2d31a636-1739-4b77-98a5-bf9b7a080626": true}}
		 */
		Cube.prototype._query_fast = function(dimensionIds, filterValues) {
			dimensionIds = dimensionIds || [];
			filterValues = filterValues || {};

			// Split by dimension {dim1Element1: {dim2Element1: **RECURSION_ELSE**}}
			if (dimensionIds.length) {
				var result = {};

				// Recurse.
				var dimensionId = dimensionIds[0],
					dimension = this.dimensions.find(function(d) { return d.id === dimensionId; }),
					otherDimensionIds = dimensionIds.slice(1);

				dimension.items.forEach(function(dimensionItem) {
					// Skip this dimension item if it is explicitely filtered.
					if (filterValues[dimensionId] && !filterValues[dimensionId][dimensionItem.id])
						return;

					// Restrict filterValues filter.
					var oldFilter = filterValues[dimensionId];
					filterValues[dimensionId] = {};
					filterValues[dimensionId][dimensionItem.id] = true;

					// Compute branch of the result tree.
					result[dimensionItem.id] = this._query_fast(otherDimensionIds, filterValues);
					if (result[dimensionItem.id] === undefined)
						delete result[dimensionItem.id];

					// Restore filter to its former value
					if (oldFilter === undefined)
						delete filterValues[dimensionId];
					else
						filterValues[dimensionId] = oldFilter;
				}, this);

				return result;
			}
			// Aggregate everything
			else {
				// Retrieve all datas that match our filter.
				var numDimensions = this.dimensions.length,
					elementaryCubes = this.elementaryCubes.filter(function(elCube) { return elCube.matchFilter(filterValues); });

				// Aggregate everything
				for (var i = numDimensions - 1; i >= 0; --i) {
					var dimension = this.dimensions[i];

					var newCubes = [];
					while (elementaryCubes.length) {
						var start = 0, end = 1;

						while (end < elementaryCubes.length) {
							for (var j = 0; j < i; ++j) {
								var dim = this.dimensions[j];
								if (elementaryCubes[end].dimensionValues[dim.id]
									!== elementaryCubes[0].dimensionValues[dim.id])
									break;
							}

							if (j == i)
								++end;
							else
								break;
						}

						var sameDimensionCubes = elementaryCubes.splice(0, end);
						var aggregatedCube = dimension.aggregate(sameDimensionCubes);

						newCubes.push(aggregatedCube);
					}

					elementaryCubes = newCubes;
				}

				if (elementaryCubes.length)
					return this.dimensions[0].aggregate(elementaryCubes).value;
				else
					return undefined;
			}
		};

		return {Dimension: Dimension, ElementaryCube: ElementaryCube, Cube: Cube}
	});

