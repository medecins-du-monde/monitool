"use strict";

var Store = require('./store');

class IndicatorStore extends Store {

	get modelString() { return 'indicator'; }


	/**
	 * Retrieve all indicators that are associated with a given theme
	 * This is used to update the indicators when deleting a theme
	 */
	listByTheme(themeId) {
		if (typeof themeId !== 'string')
			return Promise.reject(new Error("missing_parameter"));

		var view = 'indicator_by_theme', opt = {key: themeId, include_docs: true},
			Indicator = this.modelClass;
		
		return this._callView(view, opt).then(function(result) {
			return result.rows.map(row => new Indicator(row.doc));
		});
	}
}

module.exports = IndicatorStore;
