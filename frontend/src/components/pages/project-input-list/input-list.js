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

const module = angular.module(
	'monitool.components.pages.project.input.list',
	[
		uiRouter, // for $stateProvider

		mtFilterTimeSlot.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.input.list', {
		url: '/input/:dataSourceId/list',
		component: 'projectInputList',
		resolve: {
			dataSourceId: ($stateParams) => $stateParams.dataSourceId,
		}
	});
});


module.component('projectInputList', {
	bindings: {
		'project': '<',
		'dataSourceId': '<',
	},
	template: require('./input-list.html'),

	controller: class ProjectInputListController {

		constructor($rootScope, $state, $scope) {
			this.userCtx = $rootScope.userCtx;
			this.$state = $state;
			this.$scope = $scope;
		}

		$onChanges(changes) {
			// Define form
			this.dataSource = this.project.forms.find(ds => ds.id === this.dataSourceId);

			// Define sites (depending on user permissions)
			this.sites = this.project.entities.filter(e => this.dataSource.entities.includes(e.id));
			if (this.userCtx.role !== 'admin') {
				const projectUser = this.project.users.find(u => {
					return (this.userCtx.type == 'user' && u.id == this.userCtx._id) ||
						   (this.userCtx.type == 'partner' && u.username == this.userCtx.username);
				});

				if (projectUser.role === 'input')
					// This will happen regardless of unexpected entries.
					this.sites = this.sites.filter(e => projectUser.entities.includes(e.id));
			}

			// Handle special case for free periodicity.
			if (this.dataSource.periodicity === 'free') {
				this.displayFooter = true;
				this.newInputDate = new Date().toISOString().substring(0, 10);
			}

			this.loading = true;
			this.load();
		}

		async load() {
			this.inputsStatus = await Input.fetchFormStatus(this.project, this.dataSourceId);

			// Those list tell which rows should be displayed.
			this.visibleStatus = Object.keys(this.inputsStatus).slice(0, 10);
			this.hiddenStatus = Object.keys(this.inputsStatus).slice(10);

			this.loading = false;
			this.$scope.$apply();
		}

		showMore() {
			this.visibleStatus.push(...this.hiddenStatus.splice(0, 10));
		}

		addInput(entityId) {
			this.$state.go('main.project.input.edit', {
				period: this.newInputDate,
				dataSourceId: this.dataSource.id,
				entityId: entityId
			});
		}
	}
});


export default module;
