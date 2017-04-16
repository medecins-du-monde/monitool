let database = require('../database');

/**
 * This migration update a function in the design doc.
 */
module.exports = function() {
	return database.get('_design/monitool').then(function(ddoc) {

		ddoc.views.partners.map = function(doc) {
			if (doc.type === 'project') {
				doc.users.forEach(function(user) {
					if (user.type == 'partner') {
						emit(user.username, {
							type: 'partner',
							username: user.username,
							password: user.password,
							name: user.name,
							role: user.role,
							entities: user.entities,
							dataSources: user.dataSources,
							projectId: doc._id
						});
					}
				});
			}
		}.toString();

		console.log(ddoc)

		return database.insert(ddoc);
	});
};
