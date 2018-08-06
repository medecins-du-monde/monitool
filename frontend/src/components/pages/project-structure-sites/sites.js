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
import uuid from 'uuid/v4';

import uiRouter from '@uirouter/angularjs';
import uiSelect from 'ui-select';
import 'angular-legacy-sortablejs-maintained';

import 'ui-select/dist/select.min.css';

import mtDatePickerOptional from '../../shared/ng-models/datepicker-optional';


const module = angular.module(
	'monitool.components.pages.project.structure.site',
	[
		uiRouter, // for $stateProvider
		uiSelect, // for site groups
		'ng-sortable', // order sites

		mtDatePickerOptional, // Datepicker start & end
	]
);


module.config($stateProvider => {
	$stateProvider.state('main.project.structure.collection_site_list', {
		url: '/sites',
		component: 'projectSites'
	});
});


module.component('projectSites', {

	bindings: {
		// injected from parent component.
		project: '<',
		onProjectUpdate: '&'
	},

	template: require('./sites.html'),

	controller: class ProjectSitesController {

		$onInit() {
			this.ngSortableOptions = {
				handle: '.handle',
				onUpdate: this.onFieldChange.bind(this)
			};
		}

		$onChanges(changes) {
			// Project is a single way data bindings: we must not change it.
			if (changes.project)
				this.editableProject = angular.copy(this.project);
		}

		/**
		 * Called from ng-change on all inputs:
		 * tell parent component that we updated the project.
		 */
		onFieldChange() {
			this.onProjectUpdate({
				newProject: this.editableProject,
				isValid: this.sitesForm.$valid
			});
		}

		onCreateEntityClicked() {
			this.editableProject.entities.push({id: uuid(), name: '', start: null, end: null});
			this.onFieldChange();
		}

		onDeleteEntityClicked(entityId) {
			this.editableProject.entities = this.editableProject.entities.filter(e => e.id !== entityId);
			this.editableProject.sanitize();
			this.onFieldChange();
		}

		onCreateGroupClicked() {
			this.editableProject.groups.push({id: uuid(), name: '', members: []});
			this.onFieldChange();
		}

		onDeleteGroupClicked(groupId) {
			this.editableProject.groups = this.editableProject.groups.filter(group => group.id !== groupId);
			this.onFieldChange();
		}
	}
});


export default module.name;
