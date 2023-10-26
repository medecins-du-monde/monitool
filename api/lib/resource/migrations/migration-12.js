import database from "../database";
import uuidv4 from "uuid/v4";

/** Adds ids to all indicators that don't currently have one */
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
        el.content.filter = {
          dimension: el.content.filter.dimension,
          disaggregatedBy: el.content.filter.disaggregatedBy
        }
      })
      if (el.content.comment) {
        el.content.comment = {
          value: el.content.comment
        }
      }
      if (el.content.comments) {
        Object.keys(el.content.comments).forEach(function(key) {
          el.content.comments[key] = {
            value: el.content.comments[key]
          };
        });
      }
    });
  });

  // Save projects
  await database.callBulk({ docs: projects });
};
