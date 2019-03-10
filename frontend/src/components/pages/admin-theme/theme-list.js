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

import uiRouter from '@uirouter/angularjs';
import angular from 'angular';
import uiModal from 'angular-ui-bootstrap/src/modal/index';
import Theme from '../../../models/theme';
import mtThemeEditModal from './theme-edition';

const module = angular.module(
	'monitool.components.pages.admin.themelist',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal

		mtThemeEditModal
	]
);


module.config($stateProvider => {

	if (window.user.type == 'user' && window.user.role == 'admin') {
		$stateProvider.state('main.admin.theme_list', {
			url: '/admin/themes',
			component: 'themeList',
			resolve: {
				themes: () => Theme.fetchAll()
			}
		});
	}
});


module.component('themeList', {
	bindings: {
		'themes': '<'
	},

	template: require('./theme-list.html'),

	controller: class ThemeListController {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		create() {
			this._createModal()
				.then(theme => {
					this.themes.push(theme);
					theme.save();
				});
		}

		edit(theme) {
			this._createModal(theme)
				.then(newTheme => {
					angular.copy(newTheme, theme)
					theme.save();
				})
				.catch(() => { })
		}

		onDeleteClicked(theme) {
			this.themes.splice(this.themes.indexOf(theme), 1);
			theme.delete();
		}

		_createModal(theme = null) {
			return this.$uibModal
				.open({
					component: 'themeEditModal',
					size: 'lg',
					resolve: {
						theme: () => theme
					}
				})
				.result;
		}
	}
});


export default module.name;