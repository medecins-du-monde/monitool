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
import uiSelect from 'ui-select';

import 'ui-select/dist/select.min.css';

import mtUtcDatepicker from '../../shared/ng-models/datepicker';
import mtFormGroup from '../../shared/misc/form-group';


const module = angular.module(
	'monitool.components.pages.project.structure.basics',
	[
		uiRouter, // for $stateProvider
		uiSelect, // Select themes

		mtUtcDatepicker.name, // Datepicker start & end
		mtFormGroup.name
	]
);


module.config($stateProvider => {
	$stateProvider.state('main.project.structure.basics', {
		url: '/basics',
		component: 'projectBasics'
	});
});


module.component('projectBasics', {
	bindings: {
		// injected from ui-router on 'main.project'.
		themes: '<',

		// injected from parent component.
		project: '<',
		onProjectUpdate: '&'
	},

	template: require('./basics.html'),

	controller: class ProjectBasicsController {

		$onChanges(changes) {
			if (changes.project) {
				this.editableProject = angular.copy(this.project);
			}
		}

		/**
		 * Called from ng-change on all inputs.
		 */
		onFieldChange() {
			this.onProjectUpdate({
				newProject: this.editableProject,
				isValid: this.basicsForm.$valid
			});
		}

	}
});


export default module;
