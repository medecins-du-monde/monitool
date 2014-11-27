
module.exports = {
	_id: '_design/permissions',

	validate_doc_update: function(newDoc, savedDoc, userCtx) {
		var type = savedDoc ? savedDoc.type : newDoc.type;
		if (!type)
			throw "Document must have a type.";

		if (type === 'indicator' || type === 'type' || type === 'theme')
			permission = 'indicator';
		else if (type === 'project')
			permission = 'project:' + doc._id;
		else if (type === 'input')
			permission = 'input:' + doc.project;
		else
			throw "Document type is unknown.";

		if (userCtx.roles.indexOf(permission) === -1)
			throw "Permission '" + permission + "' is required to make this change";
	}.toString(),

	filters: {
		offline: function(doc, request) {
			if (doc.type === 'type' || doc.type === 'theme' || doc.type === 'indicator' || doc._id === '_design/monitool')
				return true;
			else if (request.query.projects) {
				try {
					var ids = JSON.parse(request.query.projects);
					if (doc.type === 'project')
						return request.query.projects.indexOf(doc._id);
					else if (doc.type === 'input')
						return request.query.projects.indexOf(doc.project);
					else
						return false;
				}
				catch (e) {
					return false;
				}
			}
			else
				return false;
		}.toString()
	}

};
