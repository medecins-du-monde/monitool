"use strict";

var validator = require('is-my-json-valid'),
	Model     = require('../model'),
	Store     = require('../store'),
	Theme     = require('./theme'),
	schema    = require('./indicator.json');

var validate = validator(schema);

class IndicatorStore extends Store {

	get modelClass() { return Indicator; }
	get modelString() { return 'indicator'; }


	/**
	 * Retrieve all indicators that are associated with a given theme
	 * This is used to update the indicators when deleting a theme
	 */
	listByTheme(themeId) {
		if (typeof themeId !== 'string')
			return Promise.reject(new Error("missing_parameter"));

		var view = 'indicator_by_theme', opt = {key: themeId, include_docs: true};
		return this._callView(view, opt).then(function(result) {
			return result.rows.map(row => new Indicator(row.doc));
		});
	}
}

var storeInstance = new IndicatorStore();


class Indicator extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a indicator that comes from either API or Database.
	 */
	constructor(data) {
		super(data, validate);
	}

	/**
	 * Validate that indicator does not make references to things that don't exist
	 */
	validateForeignKeys() {
		return Theme.storeInstance.list().then(function(themes) {
			this.themes.forEach(function(themeId) {
				if (themes.filter(t => t._id === themeId).length === 0)
					throw new Error('invalid_reference');
			}.bind(this));
		}.bind(this));
	}

	/**
	 * Delete indicator and updates all projects that are using it.
	 */
	destroy() {
		var Project = require('./project'); // circular import...

		return Project.storeInstance.listByIndicator(this._id, false).then(function(projects) {
			// Delete cross cutting indicator from projects.
			projects.forEach(function(project) {
				delete project.crossCutting[this._id];
			}, this);

			// Mark ourself as deleted
			this._deleted = true;

			// Save everything in on request
			return Indicator.storeInstance._callBulk({docs: projects.concat([this])});
		}.bind(this)).then(function() { /* do not pass couchdb result to caller */ });
	}
}

module.exports = Indicator;
