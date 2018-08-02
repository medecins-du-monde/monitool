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

		mtSelectIndicator.name,
		mtIndicatorFilter.name,
		mtDimensions.name,
		mtOlapGrid.name
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
			if (this._timer)
				return

			this._timer = setTimeout(async () => {
				await this._fetchData();
				this._timer = null; // FIXME this son't work
			}, 200);
		}

		async _fetchData() {
			this.errorMessage = 'shared.loading';
			this.values = null;

			// Query server
			const url = '/api/reporting/project/' + this.project._id;

			const query = {
				dimensionIds: [...this.dimensions.rows, ...this.dimensions.cols],
				filter: this.filter,
				withTotals: true,
				withGroups: true,
				computation: this.indicator.computation
			};

			const response = await axios.post(url, query);
			this.$scope.$apply(() => {
				this.errorMessage = null;

				// Format values.
				this.data = response.data;
			});
		}
	}
});


export default module;

