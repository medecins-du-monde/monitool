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
	'monitool.components.shared.reporting.select-indicator',
	[
	]
);


module.component('selectIndicator', {
	bindings: {
		project: '<', // To get the indicators
		ccIndicators: '<', // To get the names of cc indicators
		onUpdate: '&'
	},
	template: require('./select-indicator.html'),
	controller: class IndicatorSelectController {

		constructor($rootScope, $filter) {
			this.language = $rootScope.language;
			this.translate = $filter('translate');
		}

		$onChanges(changes) {
			this.elementOptions = this._computeChoices();
			this.chosenElement = this.elementOptions[0];

			this.onUpdate({
				indicator: this.chosenElement.indicator,
				logicalFramework: this.chosenElement.logicalFramework
			});
		}

		_computeChoices() {
			const choices = [];

			this.project.logicalFrames.forEach(logicalFrame => {
				var fn = indicator => {
					return {
						name: indicator.display,
						group: this.translate('project.logical_frame') + ": " + logicalFrame.name,
						logicalFramework: logicalFrame,
						indicator: indicator
					};
				};

				choices.push(...logicalFrame.indicators.map(fn));
				logicalFrame.purposes.forEach(purpose => {
					choices.push(...purpose.indicators.map(fn));
					purpose.outputs.forEach(output => {
						choices.push(...output.indicators.map(fn));
						output.activities.forEach(activity => {
							choices.push(...activity.indicators.map(fn));
						});
					});
				});
			});

			// FIXME, we can't modify this bindings (coding style)
			const ccIndicators = this.ccIndicators.slice().sort((a, b) => a.name[this.language].localeCompare(b.name[this.language]));
			ccIndicators.forEach(ccIndicator => {
				// If there no theme in common
				if (ccIndicator.themes.filter(t => this.project.themes.includes(t)).length === 0)
					return;

				choices.push({
					name: ccIndicator.name[this.language],
					group: this.translate('indicator.cross_cutting'),
					indicator: this.project.crossCutting[ccIndicator._id] || {
						display: ccIndicator.name[this.language],
						baseline: null,
						target: null,
						computation: null
					}
				});
			});

			this.project.extraIndicators.forEach(indicator => {
				choices.push({
					name: indicator.display,
					group: this.translate('indicator.extra'),
					indicator: indicator
				});
			});

			this.project.forms.forEach(dataSource => {
				dataSource.elements.forEach(variable => {
					choices.push({
						name: variable.name,
						group: this.translate('project.collection_form') + ": " + dataSource.name,
						indicator: {
							display: variable.name,
							baseline: null,
							target: null,
							computation: {
								formula: 'a',
								parameters: {
									a: {
										elementId: variable.id,
										filter: {}
									}
								}
							}
						}
					});
				});
			});

			return choices;
		}
	}
});

export default module;

