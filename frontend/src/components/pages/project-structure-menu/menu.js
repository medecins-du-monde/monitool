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


const module = angular.module(
	'monitool.components.pages.project.structure.menu',
	[
		uiRouter // for $stateProvider
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.structure', {
		abstract: true,
		component: 'projectEditMenu',
	});

});


module.component('projectEditMenu', {

	bindings: {
		project: '<',
		ccIndicators: '<',
		onProjectSaveSuccess: '&'
	},

	template: require('./menu.html'),

	controller: class ProjectEditController {

		constructor($transitions, $filter, $scope, $state) {
			this.$transitions = $transitions;
			this.$scope = $scope;
			this.translate = $filter('translate');
			this.$state = $state;
		}

		$onChanges(changes) {
			if (changes.project) {
				// this.childProject = angular.copy(this.project);
				this.projectChanged = false;

				// Unknown until first change, but the user can't save if no changes were made anyway.
				// (project will be invalid in the case of blank project creation).
				this.projectIsValid = true;
			}
		}

		$onInit() {
			this.projectSaveRunning = false;

			// Listen for any change in the URL.
			this._cancelTransitionListener = this.$transitions.onStart(
				{},
				this._onTransition.bind(this)
			);
		}

		/**
		 * Called when the user tries to change the URL.
		 * This checks that no changes were made and unsaved.
		 */
		_onTransition(transition) {
			// If project is currently saving, disable all links
			if (this.projectSaveRunning) {
				transition.abort();
				return;
			}

			// FIXME: the only patches that should be accepted w/o saving
			// are creating logical frameworks, data sources and variables (depending on the transition).

			// If project is changed, warn user that changes will be lost.
			const warning = this.translate('shared.sure_to_leave');
			if (this.projectChanged && !window.confirm(warning)) {
				transition.abort();
				return;
			}

			// Either project has not changed, or the user is OK with loosing changes.
			// => We are leaving.
			this.onResetClicked();
			if (!transition.to().name.startsWith('main.project.structure'))
				this._cancelTransitionListener();
		}

		/**
		 * Called by child component when they update their copy of the project.
		 * We replace our editable copy of the project and update flags.
		 */
		onProjectUpdate(newProject, isValid) {
			this.childProject = angular.copy(newProject);
			this.projectChanged = !angular.equals(this.project, this.childProject);
			this.projectIsValid = isValid;

			console.log('updated child project.')
		}

		/**
		 * Called by clicking on the save button.
		 */
		async onSaveClicked() {
			// When button is disabled, do not execute action.
			if (this.projectChanged && this.projectIsValid && !this.projectSaveRunning) {
				this.projectSaveRunning = true;
				this.childProject.sanitize(this.ccIndicators);

				try {
					await this.childProject.save();

					// Tell parent component that we saved the project.
					this.onProjectSaveSuccess({newProject: this.childProject});
				}
				catch (error) {
					let errorMessage = 'project.saving_failed_other';

					// Customize error message if server is telling us there was an editing conflict.
					try {
						if (error.response.data.message == 'Document update conflict.')
							errorMessage = 'project.saving_failed_conflict';
					}
					catch (e) {}

					// Display message to tell user that it's not possible to save.
					alert(this.translate(errorMessage));
				}
				finally {
					this.$scope.$apply(() => {
						this.projectSaveRunning = false;
					});
				}
			}
		}

		onResetClicked() {
			// When button is disabled, do not execute action.
			if (this.projectChanged && !this.projectSaveRunning) {
				// Trigger $onChanges on children components.
				this.project = angular.copy(this.project);
				this.projectChanged = false;
				this.projectIsValid = true;
			}
		}
	}
});


export default module.name;

