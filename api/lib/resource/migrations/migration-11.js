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
    const logicalFrames = project.logicalFrames || [];
    logicalFrames.forEach((logicalFrame) => {
      const indicators = logicalFrame.indicators || [];
      indicators.forEach((indicator) => {
        // Adding ids to logical frames indicators
        indicator.id = indicator.id || uuidv4();
      });

      const purposes = logicalFrame.purposes || [];
      purposes.forEach((purpose) => {
        // Adding ids to logical frames purposes
        purpose.id = purpose.id || uuidv4();

        const indicators = purpose.indicators || [];
        indicators.forEach((indicator) => {
          // Adding ids to purposes indicators
          indicator.id = indicator.id || uuidv4();
        });

        const outputs = purpose.outputs || [];
        outputs.forEach((output) => {
          // Adding ids to purposes outputs
          output.id = output.id || uuidv4();

          const indicators = output.indicators || [];
          indicators.forEach((indicator) => {
            // Adding ids to outputs indicators
            indicator.id = indicator.id || uuidv4();
          });

          const activities = output.activities || [];
          activities.forEach((activity) => {
            // Adding ids to outputs activities
            activity.id = activity.id || uuidv4();

            const indicators = activity.indicators || [];
            indicators.forEach((indicator) => {
              // Adding ids to activities indicators
              indicator.id = indicator.id || uuidv4();
            });
          });
        });
      });
    });

    const extraIndicators = project.extraIndicators || [];
    extraIndicators.forEach((indicator) => {
      // Adding ids to extra indicators
      indicator.id = indicator.id || uuidv4();
    });
  });

  // Save projects
  await database.callBulk({ docs: projects });
};
