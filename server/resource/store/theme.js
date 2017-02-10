"use strict";

var Store = require('./store');

class ThemeStore extends Store {

	get modelString() { return 'theme'; }

	/**
	 * Retrieve all themes with their relative usage
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

module.exports = ThemeStore;