
import database from '../database';

// Add shortName to all themes.
export default async () => {
    // Update themes.
    const result = await database.callList({ include_docs: true, startkey: 'theme:!', endkey: 'theme:~' });
    const documents = result.rows.map(r => r.doc);

    documents.forEach(doc => {
        doc.shortName = {};
        for (let key in doc.name)
            doc.shortName[key] = doc.name[key].substr(0, 5);
    });

    await database.callBulk({ docs: documents });

    // Update design document.
    const ddoc = await database.get('_design/monitool');

    ddoc.views.projects_short = {
        map: function (doc) {
            if (doc.type === 'project') {
                emit(doc._id, {
                    _id: doc._id,
                    country: doc.country,
                    name: doc.name,
                    start: doc.start, end: doc.end,
                    users: doc.users.map(function (user) {
                        return { type: user.type, id: user.id, username: user.username, role: user.role };
                    }),
                    themes: doc.themes,
                    visibility: doc.visibility,
                    active: doc.active
                });
            }
        }.toString()
    };

    await database.insert(ddoc);
};
