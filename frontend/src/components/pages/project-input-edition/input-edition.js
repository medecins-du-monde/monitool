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
import Input from '../../../models/input';

import uiRouter from '@uirouter/angularjs';
import mtFilterTimeSlot from '../../../filters/time-slot';
import mtNumberTable from './number-table';


const module = angular.module(
	'monitool.components.pages.project.input.edit',
	[
		uiRouter, // for $stateProvider
		mtFilterTimeSlot.name,
		mtNumberTable.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.input.edit', {
		url: '/input/:dataSourceId/edit/:period/:entityId',
		component: 'projectInputEdition',
		resolve: {
			inputs: $stateParams => Input.fetchLasts($stateParams.projectId, $stateParams.entityId, $stateParams.dataSourceId, $stateParams.period),
			input: inputs => inputs.current,
			previousInput: inputs => inputs.previous,
			dsId: $stateParams => $stateParams.dataSourceId,
			period: $stateParams => $stateParams.period,
			siteId: $stateParams => $stateParams.entityId

		}
	});
});


module.component('projectInputEdition', {
	bindings: {
		project: '<',
		dsId: '<',
		period: '<',
		siteId: '<',

		input: '<',
		previousInput: '<',
	},

	template: require('./input-edition.html'),

	controller: class ProjectInputEditionController {

		get isUnchanged() {
			return angular.equals(this.master, this.input);
		}

		constructor($state, $transitions, $filter) {
			this.$state = $state;
			this.$transitions = $transitions;
			this.translate = $filter('translate');
		}

		$onInit() {
			this._pageChangeWatch = this.$transitions.onStart({}, transition => {
				// if changes were made.
				const hasChanged = !angular.equals(this.master, this.input);
				if (hasChanged) {
					// then ask the user if he meant to abandon changes
					const hasConfirmed = window.confirm(this.translate('shared.sure_to_leave'))
					if (!hasConfirmed) {
						transition.abort();
						return;
					}
				}

				this._pageChangeWatch();
			});
		}

		$onChanges(changes) {
			this.isNew = false;
			this.form = this.project.forms.find(f => f.id === this.dsId);
			this.entity = this.project.entities.find(f => f.id === this.siteId);

			if (!this.input) {
				const currentInputId = ['input', this.project._id, this.dsId, this.siteId, this.period].join(':');

				this.input = new Input({
					_id: currentInputId,
					type: "input",
					project: this.project._id,
					form: this.dsId,
					period: this.period,
					entity: this.siteId,
					values: {}
				});

				this.form.elements.forEach(variable => {
					const numFields = variable.partitions.reduce((m, p) => m * p.elements.length, 1);
					this.input.values[variable.id] = new Array(numFields);
					this.input.values[variable.id].fill(0);
				});

				this.isNew = true;
			}

			this.master = angular.copy(this.input);
		}

		copy() {
			angular.copy(this.previousInput.values, this.input.values);
		}

		async save() {
			if ((!this.isNew && this.isUnchanged) || this.inputForm.$invalid)
				return;

			this._pageChangeWatch()
			await this.input.save();
			this.$state.go('main.project.input.list', {dataSourceId: this.input.form});
		}

		reset() {
			angular.copy(this.master, this.input);
		}

		async delete() {
			const question = this.translate('project.delete_input');

			if (window.confirm(question)) {
				this._pageChangeWatch(); // remove the change page watch, because it will trigger otherwise.
				await this.input.delete();
				this.$state.go('main.project.input.list', {dataSourceId: this.input.form});
			}
		}
	}
});


export default module;

