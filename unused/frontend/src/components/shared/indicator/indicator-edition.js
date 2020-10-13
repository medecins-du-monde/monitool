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
import uiModal from 'angular-ui-bootstrap/src/modal/index';
import mtNumberOptional from '../ng-models/number-optional';
import mtIndicatorComputation from './indicator-computation';

const module = angular.module(
	'monitool.components.ui-modals.indicator-edition',
	[
		uiModal, // for $uibModal

		mtNumberOptional,
		mtIndicatorComputation
	]
);


const defaultPlanning = {
	display: '',
	colorize: true,
	baseline: null,
	target: null,
	computation: null
};


module.component('indicatorEditionModal', {
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	},

	template: require('./indicator-edition.html'),

	controller: class IndicatorEditionModal {

		$onChanges(changes) {
			this.dataSources = this.resolve.dataSources;
			this.indicator = this.resolve.indicator;
			this.planning = angular.copy(this.resolve.planning || defaultPlanning);

			// cross cutting indicators have no display field.
			if (this.indicator)
				delete this.planning.display;

			this.masterPlanning = angular.copy(this.planning);
			this.isNew = !this.resolve.planning;
		}

		isUnchanged() {
			return angular.equals(this.planning, this.masterPlanning);
		}

		reset() {
			angular.copy(this.masterPlanning, this.planning);
		}

		save() {
			this.close({'$value': this.planning});
		}
	}
});


export default module.name;
