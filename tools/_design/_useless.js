
module.exports = {
	_id: '_design/monitool',

	// Allow to reformat documents
	// 
	// "shows": {
	// 	"project": function(doc, req) {0
	// 		return doc.name + ' is a capital project for our goal!';
	// 	}.toString()
	// },

	// Allow to reformat views
	// 
	// "lists": {
	// 	"by_type": function(head, req) {
	// 		var row;
	// 		while (row = getRow())
	// 			if (row.value)
	// 				send(row.value.name + "\n");
	// 	}.toString()
	// },

	// Server side code that allows to update documents
	// This can be convenient to update a document without getting it first for example (just change a field)
	// 
	// http://127.0.0.1:5984/<my_database>/_design/<my_designdoc>/_update/in-place-query/<mydocId>?field=title&value=test
	// "updates": {
	// 	"make_stupid": function(doc, req) {
	// 		doc.name = 'Stupid ' + doc.name;
	//		
	//		
	// 		return [doc, toJSON(doc)];
	// 	}.toString(),
	// },

};
