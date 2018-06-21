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
import uiRouter from '@uirouter/angularjs';
import uiModal from 'angular-ui-bootstrap/src/modal/index';

import mtIndicatorEditionModal from '../../shared/indicator/indicator-edition';
import mtIndicatorUnit from '../../../filters/indicator';

const module = angular.module(
	'monitool.components.pages.project.structure.crosscutting',
	[
		uiRouter, // for $stateProvider
		uiModal,

		mtIndicatorEditionModal.name,
		mtIndicatorUnit.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.structure.cross_cutting', {
		url: '/cross-cutting',
		component: 'crossCuttingList',
	});
});


module.component('crossCuttingList', {
	bindings: {
		// injected from ui-router on 'main.project'.
		ccIndicators: '<',
		themes: '<',

		// injected from parent component.
		project: '<',
		onProjectUpdate: '&'
	},

	template: require('./cc-indicator-list.html'),

	controller: class ProjectCrossCuttingController {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		$onChanges(changes) {
			// Project is a single way data bindings: we must not change it.
			if (changes.project || changes.themes) {
				this.editableProject = angular.copy(this.project);
				this.indicatorsByTheme = this._buildIndicatorsByTheme(this.project, this.themes, this.ccIndicators);
			}
		}

		_buildIndicatorsByTheme(project, themes, ccIndicators) {
			const indicatorsByTheme = [];

			// Create a category with indicators that match project on 2 thematics or more
			const manyThematicsIndicators = ccIndicators.filter(indicator => {
				const commonThemes = indicator.themes.filter(themeId => project.themes.includes(themeId));
				return indicator.themes.length > 1 && commonThemes.length > 0;
			});

			if (manyThematicsIndicators.length)
				indicatorsByTheme.push({definition: null, indicators: manyThematicsIndicators});

			// Create a category with indicators that match project on exactly 1 thematic
			themes.forEach(theme => {
				if (project.themes.includes(theme._id)) {
					var themeIndicators = ccIndicators.filter(i => i.themes.length === 1 && i.themes[0] === theme._id);
					if (themeIndicators.length !== 0)
						indicatorsByTheme.push({definition: theme, indicators: themeIndicators});
				}
			});

			return indicatorsByTheme;
		}

		onEditIndicatorClick(indicatorId) {
			// Indicator add, edit and remove are handled in a modal window.
			var indicator = this.editableProject.crossCutting[indicatorId];

			this.$uibModal
				.open({
					component: 'indicatorEditionModal',
					size: 'lg',
					resolve: {
						planning: () => indicator,
						indicator: () => this.ccIndicators.find(i => i._id == indicatorId),
						dataSources: () => this.editableProject.forms
					}
				})
				.result
				.then(newIndicator => {
					if (!newIndicator)
						delete this.editableProject.crossCutting[indicatorId];
					else
						this.editableProject.crossCutting[indicatorId] = newIndicator;

					// tell parent controller that the project was updated.
					this.onProjectUpdate({newProject: this.editableProject, isValid: true});
				})
				.catch(error => {})
		}
	}
});


export default module;
