"use strict";

/**
 * Ineficient OLAP cube implementation, but good enought for what we need.
 */
angular
	.module('monitool.services.olap', [])
	.factory('Olap', function() {

		/**
		 * id = "month"
		 * items = ["2010-01", "2010-02", ...]
		 * aggregation = "sum"
		 */
		var Dimension = function(id, items, aggregation) {
			this.id = id;
			this.items = items;
			this.aggregation = aggregation;
		};

		Dimension.prototype.aggregate = function(elCubes) {
			var newElCube = elCubes[0].clone();
			delete newElCube.dimensionValues[this.id]; // this one we can drop

			switch (this.aggregation) {
				case "sum":
					newElCube.value = elCubes.reduce(function(memo, cube) { return memo + cube.value; }, 0);
					break;

				case "average":
					newElCube.value = elCubes.reduce(function(memo, cube) { return memo + cube.value; }, 0) / elCubes.length;
					break;

				case "highest":
					newElCube.value = elCubes.reduce(function(memo, cube) { return memo > cube.value ? memo : cube.value; }, Math.MIN_VALUE);
					break;

				case "lowest":
					newElCube.value = elCubes.reduce(function(memo, cube) { return memo > cube.value ? cube.value : memo; }, Math.MAX_VALUE);
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
				if (filterValues[dimensionId].indexOf(this.dimensionValues[dimensionId]) === -1)
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

		Cube.prototype._sortCubes = function() {
			var numDimensions = this.dimensions.length;

			// Sort them by their dimension values.
			this.elementaryCubes.sort(function(datum1, datum2) {
				// take the first dimension that allow to separate those apart.
				for (var i = 0; i < numDimensions; ++i) {
					var dimension = this.dimensions[i],
						index1 = dimension.items.indexOf(datum1.dimensionValues[dimension.id]),
						index2 = dimension.items.indexOf(datum2.dimensionValues[dimension.id]);

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
					if (filterValues[dimensionId] && filterValues[dimensionId].indexOf(dimensionItem) === -1)
						return;

					// Restrict filterValues filter.
					var oldFilter = filterValues[dimensionId];
					filterValues[dimensionId] = [dimensionItem];

					// Compute branch of the result tree.
					result[dimensionItem] = this.query(otherDimensionIds, filterValues);

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
					return 0; // fill empty leafs on the tree.
			}
		};

		return {Dimension: Dimension, ElementaryCube: ElementaryCube, Cube: Cube}
	});

