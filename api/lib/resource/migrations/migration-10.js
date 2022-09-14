import database from '../database';

export default async () => {
    // Update design document.
    const ddoc = await database.get('_design/monitool');

    ddoc.views.inputs_with_progress = {
        map: function(doc) {
            if (doc.type === 'input') {
                var progress = 0;
                var count = 0;
                for (var key in doc.values) {
                    count++;
                    for (var i = 0; i < doc.values[key].length; ++i)
                        if (!isNaN(doc.values[key][i])) {
                            progress++;
                            break;
                        }
                }
                emit(doc._id, progress / count);
            }
        }.toString()
    };
    await database.insert(ddoc);
};
