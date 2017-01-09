"use strict";

class Variable {

	constructor(data) {
		Object.assign(this, data);
	}

	/**
	 * Signature that changes when the storage of this variable changes.
	 */
	get signature() {
		// the order of partition elements matters => to not sort!
		return JSON.stringify(
			this.partitions.map(function(partition) {
				return [partition.id].concat(
					partition.elements.map(function(partitionElement) {
						return partitionElement.id;
					})
				);
			})
		);
	}

	/**
	 * Number of fields this variable's storage.
	 */
	get numValues() {
		return this.partitions.reduce((m, p) => m * p.elements.length, 1);
	}

	/**
	 * Convert a list of partition elements ids to an index in the storage array.
	 * ['8655ac1c-2c43-43f6-b4d0-177ad2d3eb8e', '1847b479-bc08-4ced-9fc3-a569b168a764'] => 232
	 */
	computeFieldIndex(partitionElementIds) {
		var numPartitions = partitions.length;

		if (partitionElementIds.length != numPartitions)
			throw new Error('Invalid partitionElementIds.length');

		var fieldIndex = 0;
		for (var i = 0; i < numPartitions; ++i) {
			// array find.
			for (var index = 0; index < partitions[i].elements.length; ++index)
				if (partitions[i].elements[index].id == partitionElementIds[i])
					break;

			if (index == partitions[i].elements.length)
				throw new Error('Invalid partitionElementId');

			// compute field index.
			fieldIndex = fieldIndex * partitions[i].elements.length + index;
		}

		return fieldIndex;
	}

	/**
	 * Convert an index in the storage array to a list of partition elements ids.
	 * 232 => ['8655ac1c-2c43-43f6-b4d0-177ad2d3eb8e', '1847b479-bc08-4ced-9fc3-a569b168a764']
	 */
	computePartitionElementIds(fieldIndex) {
		var numPartitions = partitions.length,
			partitionElementIds = new Array(numPartitions);

		if (fieldIndex < 0)
			throw new Error('Invalid field index (negative)')

		for (var i = numPartitions - 1; i >= 0; --i) {
			partitionElementIds[i] = partitions[i].elements[fieldIndex % partitions[i].elements.length].id;
			fieldIndex = Math.floor(fieldIndex / partitions[i].elements.length);
		}

		if (fieldIndex !== 0)
			throw new Error('Invalid field index (too large)')

		return partitionElementIds;
	}
}


module.exports = Variable;

