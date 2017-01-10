"use strict";

var validator = require('is-my-json-valid'),
	Model     = require('../model'),
	Store     = require('../store'),
	Project   = require('./project'),
	schema    = require('./indicator.json');

var validate = validator(schema);

class IndicatorStore extends Store {

	get modelClass() { return Indicator; }
	get modelString() { return 'indicator'; }

}

var storeInstance = new IndicatorStore();


class Indicator extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a project that comes from either API or Database.
	 */
	constructor(data) {
		super(data, validate);
	}

	/**
	 * Delete indicator and updates all projects that are using it.
	 */
	destroy() {
		return Project.storeInstance.listCrossCutting(this._id, false).then(function(projects) {
			// Delete cross cutting indicator from projects.
			projects.forEach(function(project) { delete project.crossCutting[id]; });

			// Mark ourself as deleted
			this._deleted = true;

			// Save everything in on request
			return this._callBulk({docs: projects.concat([this])});
		});
	}
}

module.exports = Indicator;
