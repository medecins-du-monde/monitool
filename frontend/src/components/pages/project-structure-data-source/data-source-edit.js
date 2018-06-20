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

import mtOptionalDate from '../../shared/ng-models/datepicker-optional';
import mtElementFilter from '../../shared/ng-models/mselect-with-groups';
import mtPartitionList from './partition-list';
import mtPartitionDistribution from './partition-distribution';
import mtPartitionOrder from './partition-order';


const module = angular.module(
	'monitool.components.pages.project.structure.datasource.edit',
	[
		uiRouter, // for $stateProvider
		'ng-sortable',

		uiSelect, // for partition group members

		mtOptionalDate.name, // Datepicker start & end
		mtElementFilter.name, // Sites & groups associated with form
		mtPartitionList.name,
		mtPartitionDistribution.name,
		mtPartitionOrder.name,
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.structure.collection_form_edition', {
		url: '/data-source/:dataSourceId',
		component: 'dataSourceEdition',
		resolve: {
			dsId: $stateParams => $stateParams.dataSourceId
		}
	});
});


module.component('dataSourceEdition', {

	bindings: {
		// From ui-router resolve
		dsId: '<',

		// From parent component
		project: '<',
		onProjectUpdate: '&',
	},

	template: require('./data-source-edit.html'),

	controller: class DataSourceEdition {

		$onChanges(changes) {
			if (changes.project || changes.dsId) {
				// Are we creating a new data source?
				this.editableDataSource = angular.copy(this.project.forms.find(ds => ds.id == this.dsId));
				if (!this.editableDataSource) {
					this.editableDataSource = {id: this.dsId, name: '', periodicity: 'month', entities: [], start: null, end: null, elements: []};
					this.onFieldChange();
				}
			}
		}

		$onInit() {
			this.visibleVariableId = null;

			this.sortableOptions = {
				handle: '.variable-handle',
				onUpdate: this.onFieldChange.bind(this)
			};
		}

		/**
		 * Called from ng-change on all inputs:
		 * tell parent component that we updated the project.
		 */
		onFieldChange() {
			const newProject = angular.copy(this.project);
			const index = newProject.forms.findIndex(ds => ds.id === this.dsId);

			if (index !== -1)
				newProject.forms[index] = this.editableDataSource;
			else
				newProject.forms.push(this.editableDataSource);

			this.onProjectUpdate({
				newProject: newProject,
				isValid:
					// if the form is not loaded yet (calling from $onChanges), we can consider
					// than the data source is not valid (because we know it's blank).
					this.dsForm && this.dsForm.$valid &&

					// Don't allow to save data sources with no variables.
					this.editableDataSource.elements.length > 0 &&

					// Check that the variable have a name for validity.
					// There is a 'required' directive on the form, however, some inputs are not there
					// because of a 'ng-if' directive => they are not considered for validation.
					// (Using ng-show to hide the panels content is too slow: 300ms to render the page).
					this.editableDataSource.elements.reduce((m, v) => m && v.name.length > 0, true)
			});
		}

		onAddVariableClicked() {
			const newVariable = {
				id: uuid(),
				name: "",
				partitions: [],
				distribution: 0,
				geoAgg: 'sum',
				timeAgg: 'sum'
			};

			this.editableDataSource.elements.push(newVariable);
			this.onToggleVariableClicked(newVariable.id);
			this.onFieldChange();
		}

		onRemoveVariableClicked(item) {
			const index = this.editableDataSource.elements.findIndex(arrItem => item.id === arrItem.id);

			this.editableDataSource.elements.splice(index, 1)
			this.onFieldChange();
		}

		onToggleVariableClicked(variableId) {
			this.visibleVariableId = this.visibleVariableId !== variableId ? variableId : null;
		}

		onPartitionUpdate(variable, newPartitions) {
			if (variable.partitions.length !== newPartitions.length)
				variable.distribution = Math.ceil(variable.partitions.length / 2);

			variable.partitions = newPartitions;
			this.onFieldChange();
		}

	}
});


export default module;