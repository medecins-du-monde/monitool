
var nano = require('nano'),
	uuid = require('node-uuid');

var db = nano('http://localhost:5984').use('monitool');

var fixIndicator = function(project, indicator) {
	for (var key in indicator.parameters) {
		var parameter = indicator.parameters[key],
			newFilter = {};

		for (var partitionId in parameter.filter) {
			var partitionIndex = 1 * partitionId.substring('partition'.length);

			var el = null;
			project.forms.forEach(function(form) {
				form.elements.forEach(function(element) {
					if (parameter.elementId == element.id)
						el = element;
				});
			});

			var partitionUuid = el.partitions[partitionIndex].id;
			newFilter[partitionUuid] = parameter.filter[partitionId];
		}

		parameter.filter = newFilter;
	}
};


db.list({include_docs: true}, function(error, result) {

	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var documentsToKeep = [];

	var id;

	for (id in documents.project) {
		var project = documents.project[id];

		var fixIndicatorLoc = fixIndicator.bind(null, project);

		project.forms.forEach(function(form) {
			form.elements.forEach(function(elements) {
				elements.partitions = elements.partitions.map(function(partition, index) {
					return {
						id: uuid.v4(),
						name: "Partition " + index,
						elements: partition,
						groups: [],
						aggregation: 'sum'
					};
				});
			});
		});

		project.logicalFrames.forEach(function(logicalFrame) {
			logicalFrame.indicators.forEach(fixIndicatorLoc);
			logicalFrame.purposes.forEach(function(purpose) {
				purpose.indicators.forEach(fixIndicatorLoc);
				purpose.outputs.forEach(function(output) {
					output.indicators.forEach(fixIndicatorLoc);
				});
			});
		});

		documentsToKeep.push(project);
	}

	// console.log(JSON.stringify(documentsToKeep, null, "\t"));

	db.bulk({docs: documentsToKeep}, function(error, done) {
		console.log(error);
	});

});

