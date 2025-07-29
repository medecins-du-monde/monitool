import database from "../database";
import { countryList } from '../../utils/iso-countries';

/** Update comments data structure to be able to store cellValues */
export default async () => {
  // Get all projects
  const result = await database.callList({
    include_docs: true,
    startkey: "project:!",
    endkey: "project:~",
  });

  const projects = result.rows.map((r) => r.doc);
  const countries = countryList;

  projects.forEach((project) => {
    if (countries[project.country] && project.continent !== countries[project.country].continent) {
        project.continent = countries[project.country].continent
    }
  });

  // Save projects
  await database.callBulk({ docs: projects });
};
