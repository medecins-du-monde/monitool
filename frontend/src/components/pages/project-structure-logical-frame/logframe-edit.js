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

import mtIndicatorDisplay from '../../shared/indicator/display';
import mtIndicatorModal from '../../shared/indicator/indicator-edition';
import mtDirectiveAutoresize from '../../../directives/helpers/autoresize';


const module = angular.module(
	'monitool.components.pages.project.structure.logicalframe.edit',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal
		'ng-sortable',

		mtIndicatorDisplay.name,
		mtIndicatorModal.name,
		mtDirectiveAutoresize.name,
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.structure.logical_frame_edition', {
		url: '/logical-frame/:logicalFrameId?from',
		component: 'logicalFrameEdit',
		resolve: {
			logicalFrameId: $stateParams => $stateParams.logicalFrameId,
			from: $stateParams => $stateParams.from,
		}
	});
});


module.component('logicalFrameEdit', {

	bindings: {
		// from parent component
		project: '<',
		onProjectUpdate: '&',

		// from ui-router
		logicalFrameId: '<',
		from: '<'
	},

	template: require('./logframe-edit.html'),

	controller: class ProjectLogicalFrameEditController {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		$onChanges(changes) {
			if (changes.project || changes.logicalFrameId) {
				const lfs = this.project.logicalFrames;

				// Edit specified logframe
				this.editableLogFrame =
					angular.copy(lfs.find(lf => lf.id === this.logicalFrameId));

				// Or copy an existing one
				if (!this.editableLogFrame)
					this.editableLogFrame = angular.copy(lfs.find(lf => lf.id === this.from))

				// Or create a blank one.
				if (!this.editableLogFrame)
					this.editableLogFrame = {name: '', goal: '', start: null, end: null, indicators: [], purposes: []};

				// and make sure that the id is defined.
				this.editableLogFrame.id = this.logicalFrameId;
				this.onFieldChange();
			}
		}

		$onInit() {
			// Allow purposes, outputs and indicators reordering. We need to hack around bugs
			// in current Sortable plugin implementation.
			// @see https://github.com/RubaXa/Sortable/issues/581
			// @see https://github.com/RubaXa/Sortable/issues/722
			this.purposeSortOptions = {
				group:'purposes',
				handle: '.purpose-handle',
				onUpdate: this.onFieldChange.bind(this)

			};

			this.outputSortOptions = {
				group:'outputs',
				handle: '.output-handle',
				onUpdate: this.onFieldChange.bind(this)
			};

			this.activitySortOptions = {
				group:'activities',
				handle: '.activity-handle',
				onUpdate: this.onFieldChange.bind(this)
			};

			this.indicatorsSortOptions = {
				group: 'indicators',
				handle: '.indicator-handle',
				onStart: () => document.body.classList.add('dragging'),
				onEnd: () => document.body.classList.remove('dragging'),
				onUpdate: this.onFieldChange.bind(this)
			};
		}

		/**
		 * Called from ng-change on all inputs:
		 * tell parent component that we updated the project.
		 */
		onFieldChange() {
			const newProject = angular.copy(this.project);
			const index = newProject.logicalFrames.findIndex(lf => lf.id === this.logicalFrameId);

			if (index !== -1)
				newProject.logicalFrames[index] = this.editableLogFrame;
			else
				newProject.logicalFrames.push(this.editableLogFrame);

			this.onProjectUpdate({
				newProject: newProject,
				isValid:
					!!this.editableLogFrame.name &&
					(!this.lfForm || this.lfForm.$valid)
			});
		}

		onSortableMouseEvent(group, enter) {
			if (group == 'outputs')
				this.purposeSortOptions.disabled = enter;
			else if (group == 'activities')
				this.purposeSortOptions.disabled = this.outputSortOptions.disabled = enter;
			else if (group == 'indicators')
				this.purposeSortOptions.disabled = this.outputSortOptions.disabled = this.activitySortOptions = enter;
		}

		onAddPurposeClicked() {
			this.editableLogFrame.purposes.push({
				description: "", assumptions: "", indicators: [], outputs: []
			});

			this.onFieldChange();
		}

		onAddOutputClicked(purpose) {
			purpose.outputs.push({
				description: "", activities: [], assumptions: "", indicators: []
			});

			this.onFieldChange();
		}

		onAddActivityClicked(output) {
			output.activities.push({
				description: "", indicators: []
			});

			this.onFieldChange();
		}

		onRemoveClicked(element, list) {
			list.splice(list.indexOf(element), 1);
			this.onFieldChange();
		}

		onIndicatorUpdated(newIndicator, formerIndicator, list) {
			const index = list.indexOf(formerIndicator);
			list.splice(index, 1, newIndicator);

			this.onFieldChange();
		}

		onIndicatorDeleted(indicator, list) {
			const index = list.indexOf(indicator);
			list.splice(index, 1);

			this.onFieldChange();
		}

		// handle indicator add, edit and remove are handled in a modal window.
		onAddIndicatorClicked(parent) {
			this.$uibModal
				.open({
					component: 'indicatorEditionModal',
					size: 'lg',
					resolve: {
						planning: () => null,
						indicator: () => null,
						dataSources: () => this.project.forms
					}
				})
				.result
				.then(newPlanning => {
					if (newPlanning) {
						parent.push(newPlanning);
						this.onFieldChange();
					}
				});
		}
	}
});


export default module;
