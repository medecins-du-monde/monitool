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
import 'angular-legacy-sortablejs-maintained';

import mtElementGroups from '../../shared/misc/element-groups';


const module = angular.module(
	'monitool.components.pages.project.structure.datasource.list',
	[
		uiRouter, // for $stateProvider
		'ng-sortable',

		mtElementGroups
	]
);


module.config($stateProvider => {
	$stateProvider.state('main.project.structure.collection_form_list', {
		url: '/data-source',
		component: 'dataSourceList'
	});
});


module.component('dataSourceList', {
	bindings: {
		// injected from parent component.
		project: '<',
		onProjectUpdate: '&'
	},

	template: require('./data-source-list.html'),

	controller: class ProjectDataSourcesController {

		constructor($state) {
			this.$state = $state;
		}

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
		 * Called from onUpdate for the list reordering:
		 * tell parent component that we updated the project.
		 */
		onFieldChange() {
			this.onProjectUpdate({newProject: this.editableProject, isValid: true});
		}

		onCreateFormClicked() {
			this.$state.go('main.project.structure.collection_form_edition', {dataSourceId: uuid()});
		}

		onDeleteClicked(dataSource) {
			this.editableProject.forms.splice(
				this.editableProject.forms.indexOf(dataSource),
				1
			);

			this.onFieldChange();
		}

	}
});


export default module.name;
