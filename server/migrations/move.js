var nano = require('nano');


var local = nano('http://localhost:5984').use('monitool-myanmar2'),
	remote = nano('http://localhost:5985').use('monitool');

var projectIds = [

"04b8fb3c-d67d-4b31-aafd-61f87a0e435c", // georgie
"038f2da1-759a-4bad-87c4-a67144032c38", // yangon
"51f78355-34c2-4929-9cd9-ff06ada22760", // kachin mel
"76660626-5e6d-43a5-9449-bc04d285c523", // kachin ernst
"b0baaf57-3f14-4e2f-9bc6-d32b949d35c0", // nepal
"134ecdb7-7a08-4275-af7a-15416495d94e", // pakistan
"8f4431dc-6432-4020-b283-7d0fc005a0fd", // russia
"0a505dc4-d2b8-4de0-8673-22b1af441f56" // vietnam

];


local.list({include_docs: true}, function(error, result) {
	
	var documents = {indicator: {}, project: {}, theme: {}, input: {}, user: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var docsToUpdate = [];

	var id;

	for (id in documents.project) {
		var project = documents.project[id];
	
		if (projectIds.indexOf(id) !== -1) {
			delete project._rev;
			docsToUpdate.push(project);
		}
	}

	for (id in documents.input) {
		var input = documents.input[id];
	
		if (projectIds.indexOf(input.project) !== -1) {
			delete input._rev;
			docsToUpdate.push(input);
		}
	}

	// for (id in documents.theme) {
	// 	var theme = documents.theme[id];
	// 	delete theme._rev;
	// 	docsToUpdate.push(theme);
	// }

	// for (id in documents.indicator) {
	// 	var indicator = documents.indicator[id];
	// 	delete indicator._rev;
	// 	docsToUpdate.push(indicator);
	// }

	// console.log(docsToUpdate.map(d => d._id))

	remote.bulk({docs: docsToUpdate}, function(error, done) {
		console.log(error);
	});
});