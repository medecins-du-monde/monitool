
module.exports = {
	_id: '_design/permissions',

	validate_doc_update: function(newDoc, savedDoc, userCtx) {
		// admins can do what they want
		if (userCtx.roles.indexOf('_admin') !== -1)
			return;

		var type = savedDoc ? savedDoc.type : newDoc.type;
		if (!type)
			throw "Document must have a type.";
		else if (type === 'project') {
			if (savedDoc) {
				if (savedDoc.owners.indexOf(userCtx.name) !== -1)
					permission = null; // no need for permission.
				else
					throw "You need to own the project to change it.";
			}
			else {
				permission = 'project_create';
				if (newDoc.owners.indexOf(userCtx.name) !== -1)
					throw "When you create a project you need to own it";
			}
		}
		else if (type === 'indicator' || type === 'type' || type === 'theme')
			permission = 'indicator';
		else if (type === 'input')
			permission = 'input:' + doc.project;
		else
			throw "Document type is unknown.";

		if (permission && userCtx.roles.indexOf(permission) === -1)
			throw "Permission '" + permission + "' is required to make this change";
	}.toString(),

	filters: {
		projects: function(doc, request) {
			return doc.type === 'project';
		}.toString(),

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
		}.toString(),
	}

};
