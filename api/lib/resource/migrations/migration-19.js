import database from "../database";

/**
 * Add cloneFinalization to the projects_short view: once the owner removes the Clone tag, the
 * project card stops showing the "Cloned" badge and the list stops pairing it with its parent.
 */
export default async () => {
  const ddoc = await database.get('_design/monitool');

  ddoc.views.projects_short = {
      map: function (doc) {
          if (doc.type === 'project') {
              emit(doc._id, {
                  _id: doc._id,
                  continents: doc.continents,
                  countries: doc.countries,
                  region: doc.region,
                  name: doc.name,
                  start: doc.start, end: doc.end,
                  users: doc.users.map(function (user) {
                      return { type: user.type, id: user.id, username: user.username, role: user.role };
                  }),
                  themes: doc.themes,
                  visibility: doc.visibility,
                  active: doc.active,
                  clonedAt: doc.clonedAt,
                  clonedBy: doc.clonedBy,
                  clonedByName: doc.clonedByName,
                  clonedWithData: doc.clonedWithData,
                  clonedFrom: doc.clonedFrom,
                  cloneFinalization: doc.cloneFinalization
              });
          }
      }.toString()
  };

  await database.insert(ddoc);
};
