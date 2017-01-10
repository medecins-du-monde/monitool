"use strict";

var validator = require('is-my-json-valid'),
	Store = require('../store'),
	Model = require('../model'),
	schema = require('./theme.json');

var validate = validator(schema);


class ThemeStore extends Store {

	get modelClass() { return Theme; }
	get modelString() { return 'theme'; }

	/**
	 * Retrieve all themes
	 */
	listWithUsage() {
		var promises = [
			this.list(),
			this._callView('themes_usage', {group: true})
		];

		return Promise.all(promises).then(function(result) {
			var themes = result[0], usage = result[1];

			themes.forEach(function(theme) {
				var projectUsage = usage.rows.filter(function(row) { return row.key[0] === theme._id && row.key[1] === 'project'; }),
					indicatorUsage = usage.rows.filter(function(row) { return row.key[0] === theme._id && row.key[1] === 'indicator'; });

				theme.__projectUsage   = projectUsage.length ? projectUsage[0].value : 0;
				theme.__indicatorUsage = indicatorUsage.length ? indicatorUsage[0].value : 0;
			});

			return themes;
		});
	}
}

var storeInstance = new ThemeStore();


class Theme extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a project that comes from the API.
	 */
	constructor(data) {
		super(data, validate);
	}

	destroy() {
		throw new Error("Implement me");

		// Promise.all([Project.listByTheme(this._id, false), Indicator.listByTheme(this._id)])


		// return new Promise(function(resolve, reject) {




		// 	Project.listByTheme(this._id, false).then(function(projects) {
		// 		// Delete theme from projects.
		// 		projects.forEach(function(project) {
		// 			project.themes = project.themes.filter(themeId => themeId !== this._id);
		// 		}, this);

		// 		// Mark ourself as deleted
		// 		this._deleted = true;

		// 		// Save everything in on request
		// 		var docs = projects.concat([this]);
		// 		database.bulk({docs: docs}, function(error) {
		// 			if (error)
		// 				return reject(error);
		// 			resolve();
		// 		});

		// 	}.bind(this));
		// });
	}


}

module.exports = Theme;
