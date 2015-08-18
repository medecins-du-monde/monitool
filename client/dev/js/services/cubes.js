

/**
 * Ineficient OLAP cube implementation, but good enought for what we need.
 */

angular.module('olap', function() {

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

	Dimension.prototype.aggregate = function(values) {
		switch (this.aggregation) {
			case "sum":
				return values.reduce(function(a, b) { return a + b; });

			case "average":
				return values.reduce(function(a, b) { return a + b; }) / values.length;

			case "highest":
				return values.reduce(function(a, b) { return a > b ? a : b; });

			case "lowest":
				return values.reduce(function(a, b) { return a > b ? b : a; });

			case "last":
				return values[values.length - 1];

			default:
				throw new Error('Invalid mode')
		}
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




	/**
	 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
	 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
	 * data = [ElementaryCube(...), ElementaryCube(...), ElementaryCube(...), ...]
	 */
	var Cube = function(id, dimensions, elementaryCubes) {
		this.id = id;
		this.dimensions = dimensions;
		this.elementaryCubes = elementaryCubes;
	};

	/**
	 * dimensions = ['month', 'partition2']
	 * filter = {year: ['2014'], partition1: ["2d31a636-1739-4b77-98a5-bf9b7a080626"]}
	 */
	Cube.prototype.query = function(dimensionIds, filterValues) {

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
			});

			return result;
		}
		// Aggregate everything
		else {
			// Retrieve all datas that match our filter.
			var numDimensions = this.dimensions.length,
				elementaryCubes = this.elementaryCubes.filter(function(datum) { return datum.match(filterValues); });

			// Sort them by their dimension values.
			elementaryCubes.sort(function(datum1, datum2) {
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

			// Aggregate everything
			for (var i = numDimensions - 1; i >= 0; --i) {
				var dimension = this.dimensions[i],
					numItems = dimension.items.length;

				var newElementaryCubes = [];
				for (var j = 0; j < numItems; ++j) {
					var item = dimension.items[j],
						elements = [];

					while (elementaryCubes.length && elementaryCubes[0].dimensionValues[dimension.id] == item)
						elements.push(elementaryCubes.shift());


				}


				
				while (elementaryCubes.length) {
					var j = 0;
					while (true) {
						// we finished the list.
						if (j >= elementaryCubes.length)
							break;
						
						// current element is different on the dimension that we focus on.
						if (elementaryCubes[j].dimensionValues[dimension.id] !== elementaryCubes[0].dimensionValues[dimension.id])
							break

						++j;
					}

					
				}

				elementaryCubes = newData;
			}



			
		}

	};

	return {Dimension: Dimension, Datum: Datum, Cube: Cube}
});

