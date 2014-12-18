
module.exports = {
	_id: '_design/permissions',

	validate_doc_update: function(newDoc, savedDoc, userCtx) {
		// Admins can do what they want
		if (userCtx.roles.indexOf('_admin') !== -1)
			return;

		// Deletion is forbidden for everybody
		if (!newDoc || newDoc._deleted)
			throw {forbidden: "Only admins can delete projects."};

		// Handle create/update permissions
		var type = savedDoc ? savedDoc.type : newDoc.type;
		if (!type)
			throw {forbidden: "Document must have a type."};
		else if (type === 'project') {
			if (savedDoc) {
				if (savedDoc.owners.indexOf(userCtx.name) !== -1)
					permission = null; // no need for permission.
				else
					throw {forbidden: "You need to own the project to change it."};
			}
			else {
				permission = 'project_create';
				if (newDoc.owners.indexOf(userCtx.name) === -1)
					throw {forbidden: "When you create a project you need to own it"};
			}
		}
		else if (type === 'indicator' || type === 'type' || type === 'theme')
			permission = 'indicator';
		else if (type === 'input')
			// permission = 'input:' + newDoc.project;
			permission = null;
		else
			throw {forbidden: "Document type is unknown."};

		if (permission && userCtx.roles.indexOf(permission) === -1)
			throw {forbidden: "Permission '" + permission + "' is required to make this change"};
			
	}.toString(),

	filters: {
		projects: function(doc, request) {
			return doc.type === 'project';
		}.toString(),

		offline: function(doc, request) {
			if (doc._id.substring(0, '_design/'.length) === '_design/')
				return true;

			if (doc.type === 'type' || doc.type === 'theme' || doc.type === 'indicator')
				return true;
			
			if (request.query.projects) {
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
			
			return false;
		}.toString(),
	}
};

