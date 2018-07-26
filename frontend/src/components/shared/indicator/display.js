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

import uibModal from 'angular-ui-bootstrap/src/modal/index';

import mtEditionModal from './indicator-edition';
import mtIndicatorUnit from '../../../filters/indicator';

const module = angular.module(
	'monitool.components.shared.indicator.display',
	[
		uibModal, // for $uibModal
		mtEditionModal.name,
		mtIndicatorUnit.name
	]
);


module.component('indicator', {
	bindings: {
		project: '<',
		indicator: '<',

		onUpdated: '&',
		onDeleted: '&'
	},

	template: require('./display.html'),

	controller: class IndicatorController {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		onEditClicked() {
			this.$uibModal
				.open({
					component: 'indicatorEditionModal',
					size: 'lg',
					resolve: {
						planning: () => this.indicator,
						indicator: () => null,
						dataSources: () => this.project.forms
					}
				})
				.result
				.then(newIndicator => {
					if (newIndicator)
						this.onUpdated({newIndicator: newIndicator, previousValue: this.indicator});
					else
						this.onDeleted({indicator: this.indicator});
				});
		}

		onDeleteClicked() {
			this.onDeleted({indicator: this.indicator});
		}
	}
});


export default module;
