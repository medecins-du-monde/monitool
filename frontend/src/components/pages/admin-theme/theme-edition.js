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
import translate from '../../../helpers/translate';
import Theme from '../../../models/theme';


const module = angular.module(
	'monitool.components.ui-modals.theme-edition',
	[
		uiModal
	]
);


module.component('themeEditModal', {
	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	},

	template: require('./theme-edition.html'),

	controller: class ThemeEditModalController {

		get hasChanged() {
			return !angular.equals(this.theme, this.master);
		}

		constructor($rootScope, $scope) {
			this.$scope = $scope; // Needed to $apply automatic translation
			this.languages = $rootScope.languages;
		}

		$onChanges(changes) {
			this.theme = angular.copy(this.resolve.theme) || new Theme();
			this.isNew = !this.resolve.theme;
			this.master = angular.copy(this.theme);
		}

		save() {
			this.close({'$value': this.theme});
		}

		autofill(writeLanguageCode) {
			for (let readLanguageCode in this.languages) {
				const input = this.theme.name[readLanguageCode];

				if (readLanguageCode !== writeLanguageCode && input.length) {
					translate(input, writeLanguageCode, readLanguageCode)
						.then(result => {
							this.$scope.$apply(() => {
								this.theme.name[writeLanguageCode] = result;
							});
						});

					break;
				}
			}
		}
	}

});


export default module;