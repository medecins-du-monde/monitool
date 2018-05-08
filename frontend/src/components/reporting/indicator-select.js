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


const module = angular.module(
	'monitool.components.reporting.indicatorselect',
	[
	]
);


module.component('indicatorSelect', {
	bindings: {
		project: '<', // To get the indicators
		ccIndicators: '<', // To get the names of cc indicators
		onUpdate: '&'
	},
	template: `
		<div class="input-group">
			<span class="input-group-addon"><i class="fa fa-tachometer fa-fw"></i></span>
			<select id="element-input"
					class="form-control input-sm"
					ng-model="$ctrl.chosenElement"
					ng-change="$ctrl.onUpdate({element: $ctrl.chosenElement})"
					ng-options="i as i.name group by i.group for i in $ctrl.elementOptions"></select>
		</div>
	`,
	controller: function($rootScope, $filter) {

		this.$onChanges = changes => {
			this.elementOptions = [];

			this.project.logicalFrames.forEach((logicalFrame, i0) => {
				var fn = function(i) {
					return {
						logicalFrameIndex: i0,
						name: i.display,
						type: "indicator",
						group: $filter('translate')('project.logical_frame') + ": " + logicalFrame.name,
						indicator: i
					};
				};

				this.elementOptions.push(...logicalFrame.indicators.map(fn));
				logicalFrame.purposes.forEach(purpose => {
					this.elementOptions.push(...purpose.indicators.map(fn));
					purpose.outputs.forEach(output => {
						this.elementOptions.push(...output.indicators.map(fn));
						output.activities.forEach(activity => {
							this.elementOptions.push(...activity.indicators.map(fn));
						});
					});
				});
			});

			// this.indicators.sort((a, b) => a.name[$rootScope.language].localeCompare(b.name[$rootScope.language]));
			this.ccIndicators.forEach(ccIndicator => {
				// If there no theme in common
				if (ccIndicator.themes.filter(t => this.project.themes.includes(t)).length === 0)
					return;

				this.elementOptions.push({
					logicalFrameIndex: null,
					name: ccIndicator.name[$rootScope.language],
					type: "indicator",
					group: $filter('translate')('indicator.cross_cutting'),
					indicator: this.project.crossCutting[ccIndicator._id] || {
						display: ccIndicator.name[$rootScope.language],
						baseline: null,
						target: null,
						computation: null
					}
				});
			});

			this.project.extraIndicators.forEach(planning => {
				this.elementOptions.push({
					name: planning.display,
					type: "indicator",
					group: $filter('translate')('indicator.extra'),
					indicator: planning
				});
			});

			this.project.forms.forEach(form => {
				form.elements.forEach(element => {
					this.elementOptions.push({
						name: element.name,
						type: "variable",
						group: $filter('translate')('project.collection_form') + ": " + form.name,
						element: element,
						form: form
					});
				});
			});

			this.chosenElement = this.elementOptions[0];
			this.onUpdate({element: this.chosenElement});
		};
	}
});

export default module;

