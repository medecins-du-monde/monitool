
import database from '../database';

// Add new view to access inputs by variable
export default async () => {
	// Update design document.
	const ddoc = await database.get('_design/monitool');

	ddoc.views.inputs_variable = {
		map: function(doc) {
			if (doc.type === 'input') {
				for (var variableId in doc.values) {
					var content = {
						_id: doc._id,
						type: 'input',
						project: doc.project,
						entity: doc.entity,
						form: doc.form,
						period: doc.period,
						values: {},
						structure: {}
					};

					content.values[variableId] = doc.values[variableId];
					content.structure[variableId] = doc.structure[variableId];
					emit(doc.project + ':' + doc.form + ':' + variableId, content);
				}
			}
		}.toString().replace(/[\n\t\s]+/g, ' ')
	};

	await database.insert(ddoc);
};

