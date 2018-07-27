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
import Indicator from '../../../models/indicator';
import Theme from '../../../models/theme';

import uiRouter from '@uirouter/angularjs';
import uiModal from 'angular-ui-bootstrap/src/modal/index';
import uiSelect from 'ui-select';

import 'ui-select/dist/select.min.css';

import mtDirectiveAutoresize from '../../../directives/helpers/autoresize';
import mtCcIndicatorEdit from './cc-indicator-edition';

const module = angular.module(
	'monitool.components.pages.admin.cc-indicator-list',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal
		uiSelect, // for <ui-select>

		mtDirectiveAutoresize.name,
		mtCcIndicatorEdit.name
	]
);


module.config($stateProvider => {

	if (window.user.type == 'user' && window.user.role == 'admin') {

		$stateProvider.state('main.admin.indicator_list', {
			url: '/admin/indicators',
			component: 'adminIndicatorList',
			resolve: {
				indicators: () => Indicator.fetchAll(),
				themes: () => Theme.fetchAll()
			}
		});
	}
});


module.component('adminIndicatorList', {

	bindings: {
		indicators: '<',
		themes: '<'
	},

	template: require('./cc-indicator-list.html'),

	controller: class AdminIndicatorListController {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		$onChanges(changes) {
			// Give a color to each theme
			if (changes.themes) {
				const classes = ["text-primary", "text-success", "text-info", "text-warning", "text-danger"];

				this.themes = angular.copy(this.themes); // we must not change a one-way binding => clone.
				this.themes.forEach((theme, index) => theme.class = classes[index % classes.length]);
			}
		}

		onCreateClicked() {
			this._createModal().then(indicator => {
				this.indicators.push(indicator);
				indicator.save();
			});
		}

		onEditClicked(indicator) {
			this._createModal(indicator)
				.then(newIndicator => {
					angular.copy(newIndicator, indicator);
					indicator.save();
				})
				.catch(error => {})
		}

		onDeleteClicked(indicator) {
			this.indicators.splice(this.indicators.indexOf(indicator), 1);
			indicator.delete();
		}

		_createModal(indicator=null) {
			return this.$uibModal
				.open({
					component: 'ccIndicatorEditionModal',
					size: 'lg',
					resolve: {
						themes: () => this.themes,
						indicator: () => indicator,
					}
				})
				.result;
		}
	}
});

export default module;
