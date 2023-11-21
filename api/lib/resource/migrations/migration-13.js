import database from "../database";
import uuidv4 from "uuid/v4";

/** Update comments data structure to be able to store cellValues */
export default async () => {
  // Get all projects
  const result = await database.callList({
    include_docs: true,
    startkey: "project:!",
    endkey: "project:~",
  });

  const projects = result.rows.map((r) => r.doc);

  projects.forEach((project) => {
    const comments = project.comments || [];
    comments.forEach((comment) => {
      comment.content.map((el) => {
        const content = el.content || el;
        content.filter = {
          dimension: content.filter.dimension,
          disaggregatedBy: content.filter.disaggregatedBy
        }
        if (content.comment) {
          content.comment = {
            value: content.comment
          }
        }
        if (content.comments) {
          Object.keys(content.comments).forEach(function(key) {
            content.comments[key] = {
              value: content.comments[key]
            };
          });
        }
      })
    });
  });

  // Save projects
  await database.callBulk({ docs: projects });
};
