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
import 'angular-legacy-sortablejs-maintained';

import mtIndicatorEditionModal from '../../shared/indicator/indicator-edition';

const module = angular.module(
	'monitool.components.pages.project.structure.extraindicator',
	[
		uiRouter, // for $stateProvider
		uiModal,
		'ng-sortable',

		mtIndicatorEditionModal,
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.structure.extra', {
		url: '/extra',
		component: 'extraIndicatorList',
	});

});


module.component('extraIndicatorList', {

	bindings: {
		// injected from parent component.
		project: '<',
		onProjectUpdate: '&'
	},

	template: require('./extra-indicators.html'),

	controller: class ProjectExtraIndicators {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		$onInit() {
			this.sortableOptions = {
				handle: '.indicator-handle',
				onUpdate: () => this.onProjectUpdate({newProject: this.editableProject, isValid: true})
			};
		}

		$onChanges(changes) {
			// Project is a single way data bindings: we must not change it.
			if (changes.project)
				this.editableProject = angular.copy(this.project);
		}

		onIndicatorUpdated(newIndicator, formerIndicator) {
			const index = this.editableProject.extraIndicators.indexOf(formerIndicator);
			this.editableProject.extraIndicators.splice(index, 1, newIndicator);

			this.onProjectUpdate({newProject: this.editableProject, isValid: true});
		}

		onIndicatorDeleted(indicator) {
			const index = this.editableProject.extraIndicators.indexOf(indicator);
			this.editableProject.extraIndicators.splice(index, 1);

			this.onProjectUpdate({newProject: this.editableProject, isValid: true});
		}

		onAddIndicatorClick() {
			this.$uibModal
				.open({
					component: 'indicatorEditionModal',
					size: 'lg',
					resolve: {
						planning: () => null,
						indicator: () => null,
						dataSources: () => this.editableProject.forms
					}
				})
				.result
				.then(newIndicator => {
					if (newIndicator) {
						this.editableProject.extraIndicators.push(newIndicator);
						this.onProjectUpdate({newProject: this.editableProject, isValid: true});
					}
				});
		}
	}
})


export default module.name;

