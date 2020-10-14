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

		mtFilterTimeSlot
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

		constructor($element, $rootScope, $state, $scope) {
			this.userCtx = $rootScope.userCtx;
			this.$state = $state;
			this.$scope = $scope;
			this._element = $element;
		}

		$onInit() {
			this._binded = this._onScroll.bind(this);
		}

		$onDestroy() {
			if (this._container)
				this._container.unbind('scroll', this._binded);
		}

		_onScroll() {
			this.headerStyle = {
				transform: 'translate(0, ' + this._container[0].scrollTop + 'px)'
			};

			this.firstColStyle = {
				transform: 'translate(' + this._container[0].scrollLeft + 'px)'
			};

			this.$scope.$apply();
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

			// if there are results, bind a scroll event to the div around the table.
			// this is extremely hacky and will break when the template is changed. There must be a better way
			if (this.visibleStatus.length) {
				this._container = angular.element(this._element.children()[2]);
				this._container.bind('scroll', this._binded);
			}
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


export default module.name;
