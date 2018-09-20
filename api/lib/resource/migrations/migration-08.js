
import database from '../database';

// Add new view to access inputs by variable
export default async () => {
	// Update design document.
	const ddoc = await database.get('_design/monitool');

	ddoc.views.inputs_variable = {
		map: function(doc) {
			if (doc.type === 'input') {
				for (var variableId in doc.values) {
					emit(doc.project + ':' + doc.form + ':' + variableId, {
						v: doc.values[variableId],
						s: doc.structure[variableId]
					});
				}
			}
		}.toString().replace(/[\n\t\s]+/g, ' ')
	};

	await database.insert(ddoc);
};

