
import database from '../database';

// Add new view to access last input data of each project.
export default async () => {
	// Update design document.
	const ddoc = await database.get('_design/monitool');

	ddoc.views.inputs_updated_at = {
		map: function(doc) {
			if (doc.type === 'input' && doc.updatedAt)
				emit(doc.project, doc.updatedAt);

		}.toString().replace(/[\n\t\s]+/g, ' '),

		reduce: function(key, values, rereduce) {
			return values.reduce(function(memo, updatedAt) {
				return memo < updatedAt ? updatedAt : memo;
			});
		}.toString().replace(/[\n\t\s]+/g, ' ')
	};

	await database.insert(ddoc);
};
