import database from "../database";

// Fixes bug on inputs_with_progress view.
export default async () => {
  // Update design document.
  const ddoc = await database.get("_design/monitool");

  ddoc.views.inputs_with_progress = {
    map: function (doc) {
      if (doc.type === "input") {
        var progress = 0;
        var count = 0;
        for (var key in doc.values) {
          for (var i = 0; i < doc.values[key].length; ++i) {
            count++;
            if (doc.values[key][i] !== null) {
              progress++;
            }
          }
        }

        emit(doc._id, progress / count);
      }
    }
      .toString()
      .replace(/\n/g, "")
      .replace(/\s+/g, " "),
  };
  await database.insert(ddoc);
};
