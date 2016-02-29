
/**
 * id = "month"
 * items = ["2010-01", "2010-02", ...]
 * aggregation = "sum"
 */
var Dimension = function(id, items, aggregation) {
	this.id = id;
	this.items = items;
	this.aggregation = aggregation;
	this.items.sort();
};

/**
 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
 * data = [ElementaryCube(...), ElementaryCube(...), ElementaryCube(...), ...]
 */
var Cube = function(id, dimensions, data) {
	this.id = id;
	this.dimensions = dimensions;
	this.data = data;

	// Check size.
	var dataSize = 1;
	dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });
	if (!data)
		data = new Array(dataSize);
	else if (data.length !== dataSize)
		throw new Error('Invalid data size');
};

Cube.fromProject = function(project, allInputs) {
	// Create all cubes.
	var cubes = {};

	project.forms.forEach(function(form) {
		var inputs = allInputs.filter(function(input) { return input.form == form.id; });

		// Create shared dimension elements.
		var entities = project.entities.map(function(entity) { return entity.id; }),
			days = {};

		// Create dimensionValues for each input in advance.
		var refDimensionValuesByInput = {};
		inputs.forEach(function(input) {
			var period = moment(input.period);
			var refDimensionValues = { day: period.format('YYYY-MM-DD'), entity: input.entity };

			refDimensionValuesByInput[input._id] = refDimensionValues;
			days[refDimensionValues.day] = true;
		});

		days = Object.keys(days).sort();

		form.elements.forEach(function(element) {
			var numPartitions = element.partitions.length;

			var dimensions = [
				new Dimension('entity', 'project.entity', entities, element.geoAgg),
				new Dimension('day', 'shared.day', days, element.timeAgg)
			].concat(element.partitions.map(function(partition, index) {
				return new Dimension('partition' + index, partition, 'sum')
			}));

			cubes[element.id] = new Cube(element.id, dimensions);

			inputs.forEach(function(input) {
				var refDimensionValues = refDimensionValuesByInput[input._id];

				if (numPartitions > 0) {
					itertools.product(element.partitions).forEach(function(partition) {
						var dimensionValues = {};

						// clone shared dimensions
						for (var key in refDimensionValues)
							dimensionValues[key] = refDimensionValues[key];

						// add partitions
						for (var i = 0; i < numPartitions; ++i)
							dimensionValues['partition' + i] = partition[i].id;
						
						var value = input.values[element.id][partition.pluck('id').sort().join('.')] || 0;
						
						cubes[element.id].setValue(dimensionValues, value);
						// return new ElementaryCube(dimensionValues, value);
					});

					// append new cubes
					// Array.prototype.push.apply(elementaryCubes, elCubes);
				}
				else {
					cubes[element.id].setValue(refDimensionValues, input.values[element.id][''] || 0);
					// elementaryCubes.push(new ElementaryCube(refDimensionValues, input.values[element.id][''] || 0));
				}
			}, this);
		}, this);
	}, this);

	return cubes;
};

Cube.prototype.setValue = function(dimensionValues, value) {
	var index = 0, numDimensions = this.dimensions.length;

	for (var dimensionId = 0; dimensionId < numDimensions; ++dimensionId) {
		var dimension = this.dimensions[dimensionId];

	}
};

Cube.prototype.groupedQuery = function(dimensionIds, filter) {
	// End condition
	if (dimensionIds.length == 0)
		return this.query(filter);

	var dimensionId = dimensionIds.shift();

	// search dimension
	var dimension, numDimension = this.dimensions.length;
	for (var dimensionIndex = 0; dimensionIndex < numDimension; ++dimensionIndex)
		if (this.dimensions[dimensionIndex].id == dimensionId) {
			dimension = this.dimensions[dimensionIndex];
			break;
		}

	// Build tree
	var result = {};
	var numDimensionItems = dimension.items.length;
	for (var dimensionItemId = 0; dimensionItemId < numDimensionItems; ++dimensionItemId) {
		var dimensionItem = dimension.items[dimensionItemId];

		// Intersect main filter with branch filter (branch filter is only one item, so it's easy to compute).
		var oldFilter = filter[dimensionId];
		if (!oldFilter || oldFilter.indexOf(dimensionItem) !== -1)
			filter[dimensionId] = [dimensionItem];
		else
			// Either lines do the same. Continuing is a bit faster.
			// filter[dimensionId] = [];
			continue;
		
		// Compute branch of the result tree.
		result[dimensionItem] = this.groupedQuery(dimensionIds, filter);

		// Remove if empty
		var isEmpty = true;
		for (var _ in result[dimensionItem]) { isEmpty = false; break; }
		if (isEmpty)
			delete result[dimensionItem];

		// Restore filter to its former value
		if (oldFilter === undefined)
			delete filter[dimensionId];
		else
			filter[dimensionId] = oldFilter;
	}

	dimensionIds.unshift(dimensionId);

	return result;
};

/**
 * filter = {year: ['2014'], partition1: ["2d31a636-1739-4b77-98a5-bf9b7a080626"]}
 */
Cube.prototype.query = function(filter) {
	var indexes = this.dimensions.map(function(dimension) {
		var result;

		// No filter => filter is range(0, dimension.items.length)
		if (!filter[dimension.id]) {
			result = new Array(dimension.items.length);
			for (var i = 0; i < result.length; ++i)
				result[i] = i;
		}
		// Yes filter => map strings to ids in the real query.
		else {
			// Now we need to map our list of strings to indexes.
			result = filter[dimension.id].slice();
			result.sort()

			var filterId = 0, dimensionItemId = 0;
			while (filterId < result.length) {
				// we could do a dichotomy to go a bit faster.
				while (result[filterId] != dimension.items[dimensionItemId] && dimensionItemId < dimension.items.length)
					++dimensionItemId;

				result[filterId] = dimensionItemId;
				++filterId;
			}
		}

		return result;
	});

	return this._query_rec(indexes, 0);
};

// FIXME we need to push/pop instead of shift/unshift (it's 10 times faster).
Cube.prototype._query_rec = function(allIndexes, offset) {
	if (allIndexes.length == 0)
		return this.data[offset];

	var dimension  = this.dimensions[this.dimensions.length - allIndexes.length],
		indexes    = allIndexes.shift(),
		dimLength  = dimension.items.length,
		numIndexes = indexes.length;

	var result, tmp;
	if (dimension.aggregation == 'sum') {
		result = 0;
		for (var i = 0; i < numIndexes; ++i)
			result += this._query_rec(allIndexes, offset * dimLength + indexes[i])
	}
	else if (dimension.aggregation == 'average') {
		result = 0;
		for (var i = 0; i < numIndexes; ++i)
			result += this._query_rec(allIndexes, offset * dimLength + indexes[i])
		result /= numIndexes;
	}
	else if (dimension.aggregation == 'highest') {
		result = Math.MIN_VALUE;
		for (var i = 0; i < numIndexes; ++i) {
			tmp = this._query_rec(allIndexes, offset * dimLength + indexes[i]);
			if (tmp > result)
				result = tmp;
		}
	}
	else if (dimension.aggregation == 'lowest') {
		result = Math.MAX_VALUE;
		for (var i = 0; i < numIndexes; ++i) {
			tmp = this._query_rec(allIndexes, offset * dimLength + indexes[i]);
			if (tmp < result)
				result = tmp;
		}
	}
	else if (dimension.aggregation == 'last') {
		result = this._query_rec(allIndexes, offset * dimLength + indexes[indexes.length - 1]);
	}
	else
		throw new Error('Invalid mode');

	allIndexes.unshift(indexes)

	return result;
};



var cube = new Cube(
	'someId',
	[
		new Dimension('time', ['monday', 'tuesday'], 'sum'),
		new Dimension('space', ['madrid', 'paris'], 'sum')
	],
	[
		1,	// monday/madrid
		2,	// monday/paris
		4,	// tuesday/madrid
		8	// tuesday/paris
	]
)

console.log(cube.groupedQuery(['time', 'space'], {space: []}))
