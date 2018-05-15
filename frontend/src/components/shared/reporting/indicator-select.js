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
	'monitool.components.shared.reporting.indicator-select',
	[
	]
);


module.component('indicatorSelect', {
	bindings: {
		project: '<', // To get the indicators
		ccIndicators: '<', // To get the names of cc indicators
		onUpdate: '&'
	},
	template: require('./indicator-select.html'),
	controller: class IndicatorSelectController {

		constructor($rootScope, $filter) {
			this.language = $rootScope.language;
			this.translate = $filter('translate');
		}

		$onChanges(changes) {
			this.elementOptions = [];

			this.project.logicalFrames.forEach((logicalFrame, i0) => {
				var fn = i => {
					return {
						logicalFrameIndex: i0,
						name: i.display,
						type: "indicator",
						group: this.translate('project.logical_frame') + ": " + logicalFrame.name,
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

			// FIXME, we can't modify this bindings (coding style)
			// this.indicators.sort((a, b) => a.name[this.language].localeCompare(b.name[this.language]));
			this.ccIndicators.forEach(ccIndicator => {
				// If there no theme in common
				if (ccIndicator.themes.filter(t => this.project.themes.includes(t)).length === 0)
					return;

				this.elementOptions.push({
					logicalFrameIndex: null,
					name: ccIndicator.name[this.language],
					type: "indicator",
					group: this.translate('indicator.cross_cutting'),
					indicator: this.project.crossCutting[ccIndicator._id] || {
						display: ccIndicator.name[this.language],
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
					group: this.translate('indicator.extra'),
					indicator: planning
				});
			});

			this.project.forms.forEach(form => {
				form.elements.forEach(element => {
					this.elementOptions.push({
						name: element.name,
						type: "variable",
						group: this.translate('project.collection_form') + ": " + form.name,
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

