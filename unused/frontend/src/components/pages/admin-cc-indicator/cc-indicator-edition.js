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
import Indicator from '../../../models/indicator';

const module = angular.module(
	'monitool.components.ui-modals.cc-indicator-edition',
	[
		uiModal
	]
);

module.component('ccIndicatorEditionModal', {
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	},

	template: require('./cc-indicator-edition.html'),

	controller: class IndicatorEditModalController {

		get indicatorChanged() {
			return !angular.equals(this.master, this.indicator);
		}

		get indicatorSavable() {
			return this.indicatorChanged && !this.$scope.indicatorForm.$invalid;
		}

		constructor($scope) {
			this.$scope = $scope;
		}

		$onChanges(changes) {
			this.indicator = angular.copy(this.resolve.indicator) || new Indicator();
			this.master = angular.copy(this.indicator);
			this.themes = this.resolve.themes;
			this.isNew = !this.resolve.indicator;
		}

		save() {
			if (!this.indicatorSavable)
				return;

			this.close({ $value: this.indicator });
		}
	}
});


export default module.name;
