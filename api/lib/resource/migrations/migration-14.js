import database from '../database';

/**
 * Not used at the end, but it could be usefull if needed on a future
 */
// const migrateInputs = async () => {
// 	// Total inputs updated
// 	let updatedInputs = 0;

// 	// Get all projects
// 	const resultP = await database.callList({
// 	  include_docs: true,
// 	  startkey: "project:!",
// 	  endkey: "project:~",
// 	});
  
// 	const projects = resultP.rows.map((r) => r.doc);
// 	for (let i = 0; i < projects.length; i++) {
// 		const project = projects[i];
// 		console.log(`(${i + 1} of ${projects.length}) Getting inputs`);
// 		// Get all inputs
// 		const result = await database.callList({
// 		  include_docs: true,
// 		  startkey: `input:${project._id}!`,
// 		  endkey: `input:${project._id}~`,
// 		});
// 		const inputs = result.rows.map((r) => r.doc);
	  
// 		await inputs.forEach(async (input) => {
// 			var progress = 0;
// 			var count = 0;
// 			for (var key in input.values) {
// 			  for (var i = 0; i < input.values[key].length; ++i) {
// 				count++;
// 				if (input.values[key][i] !== null) {
// 				  progress++;
// 				}
// 			  }
// 			}
// 			if (progress / count === 1) {
// 				input.blocked = true;
// 				updatedInputs++;
// 			}
// 		});

// 		console.log(`(${i + 1} of ${projects.length}) Saving inputs`);
// 		await database.callBulk({ docs: inputs });
// 		console.log(`(${i + 1} of ${projects.length}) Inputs saved\n`);
// 	};

// 	console.log(`\n\nUpdate finished\n${updatedInputs} inputs have been locked\n\n`);
// };

/**
 * Update the view so it also returns the blocked variable of the input
 */
const migrateDesignDoc = async () => {
	// Update design document.
	const ddoc = await database.get('_design/monitool');

	// Inputs with progress view is updated to also get if the input is blocked.
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
	
			emit(doc._id, {progress: progress / count, blocked: doc.blocked ? true : false});
		  }
		}
		.toString()
		.replace(/\n/g, "")
		.replace(/\s+/g, " "),
	};

	await database.insert(ddoc);
};

/**
 * Migrate view for 
 */
export default async function() {
	// The order matters, do not change it.
	// await migrateInputs();
	await migrateDesignDoc();
};
