import database from '../database';

/**
 * This migration update a function in the design doc.
 */
export default async () => {
	const ddoc = await database.get('_design/monitool');

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

	return database.insert(ddoc);
};
