import database from "../database";

/** Update countries and continents to be arrays */
export default async () => {
  // Get all projects
  const result = await database.callList({
    include_docs: true,
    startkey: "project:!",
    endkey: "project:~",
  });

  const projects = result.rows.map((r) => r.doc);

  projects.forEach((project) => {
    if (project.continent && !Array.isArray(project.continent)) {
        project.continents = [project.continent];
        delete project.continent;
    }
    if (project.country && !Array.isArray(project.country)) {
        project.countries = [project.country];
        delete project.country;
    }
  });

  // Save projects
  await database.callBulk({ docs: projects });
  
  // Update design document with new plural names for countries and continents
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
                  active: doc.active
              });
          }
      }.toString()
  };

  await database.insert(ddoc);
};
