
import database from '../database';

// Add shortName to all themes.
export default async () => {

    // Update design document.
    const ddoc = await database.get('_design/monitool');

    ddoc.views.projects_short = {
        map: function (doc) {
            if (doc.type === 'project') {
                emit(doc._id, {
                    _id: doc._id,
                    continent: doc.continent,
                    country: doc.country,
                    region: doc.region,
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
