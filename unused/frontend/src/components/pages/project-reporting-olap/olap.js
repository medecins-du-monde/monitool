/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import angular from 'angular';
import axios from 'axios'

import uiRouter from '@uirouter/angularjs';
import uiSelect from 'ui-select';

import 'ui-select/dist/select.min.css';

import mtSelectIndicator from './select-indicator';
import mtIndicatorFilter from './indicator-filter';
import mtDimensions from './dimensions';
import mtOlapGrid from './olap-grid';

const module = angular.module(
	'monitool.components.pages.project.reporting.olap',
	[
		uiRouter, // for $stateProvider
		uiSelect,

		mtSelectIndicator,
		mtIndicatorFilter,
		mtDimensions,
		mtOlapGrid
	]
);


module.config($stateProvider => {
	$stateProvider.state('main.project.reporting.olap', {
		url: '/olap',
		component: 'olapReporting'
	});

});

module.component('olapReporting', {
	bindings: {
		project: '<',
		ccIndicators: '<'
	},

	template: require('./olap.html'),

	controller: class OlapReportingController {

		constructor($scope) {
			this.$scope = $scope;

			// Autoincrementing id, to work around
			// slow fetches breaking interface for long ones.
			this._fetchId = 0;
			this._timeout = null;
		}

		onIndicatorUpdated(indicator, logicalFramework) {
			this.indicator = indicator;
			this.logicalFramework = logicalFramework;
			this._fetchDataSoon();
		}

		onFilterUpdated(filter) {
			this.filter = filter;
			this._fetchDataSoon();
		}

		onDimensionsUpdated(dimensions) {
			this.dimensions = dimensions;
			this._fetchDataSoon();
		}

		_fetchDataSoon() {
			if (this._timeout !== null)
				clearTimeout(this._timeout);

			this._timeout = setTimeout(async () => {
				await this._fetchData();
				this._timeout = null; // FIXME this son't work
			}, 200);
		}

		async _fetchData() {
			const myFetchId = ++this._fetchId;

			// Tell display that we are loading results.
			this.errorMessage = 'shared.loading';
			this.data = null;
			this.$scope.$apply();

			// Query server
			const response = await axios.post('/api/reporting/project/' + this.project._id, {
				dimensionIds: [...this.dimensions.rows, ...this.dimensions.cols],
				filter: this.filter,
				withTotals: true,
				withGroups: true,
				computation: this.indicator.computation
			});

			// Ignore query result if a new query was launched in between.
			if (this._fetchId === myFetchId) {
				this.errorMessage = null;
				this.data = response.data;
				this.$scope.$apply();
			}
		}
	}
});


export default module.name;
