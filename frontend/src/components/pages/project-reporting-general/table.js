
import angular from 'angular';
import uuid from 'uuid/v4';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';

import mtIndicatorsTbody from './tbody-indicators';

const module = angular.module(
	'monitool.components.pages.project.reporting_general.table',
	[
		mtIndicatorsTbody.name,
	]
);


module.component('generalTable', {
	bindings: {
		project: '<',
		themes: '<',

		filter: '<',
		groupBy: '<',
		ccIndicators: '<',

		onGraphToggle: '&'
	},
	template: require('./table.html'),
	controller: class GeneralTableController {

		constructor($filter, $rootScope) {
			this._formatSlot = $filter('formatSlot');
			this._formatSlotRange = $filter('formatSlotRange');
			this.language = $rootScope.language;
		}

		$onChanges(changes) {
			// Refresh columns when the query changes.
			if (changes.groupBy || changes.filter)
				this.columns = this._computeColumns();

			if (changes.project)
				this.tbodies = this._computeTBodies();
		}

		_computeTBodies() {
			const tbodies = [];

			tbodies.push(...this.project.logicalFrames.map(lf => this._logicalFrameworkToTbody(lf)));
			tbodies.push(this._ccIndicatorsToTbody());
			tbodies.push(this._extraIndicatorsToTbody());
			tbodies.push(...this.project.forms.map(ds => this._dataSourceToTbody(ds)));

			return tbodies;
		}

		_logicalFrameworkToTbody(logicalFramework) {
			const tbody = {
				prefix: 'project.logical_frame',
				name: logicalFramework.name,
				sections: []
			};

			tbody.sections.push({
				id: logicalFramework.id,
				name: logicalFramework.name,
				indicators: logicalFramework.indicators.map(i => Object.assign({}, i, {id: uuid()})),
				indent: 0
			});

			logicalFramework.purposes.forEach(purpose => {
				tbody.sections.push({
					id: uuid(),
					name: purpose.description,
					indicators: purpose.indicators.map(i => Object.assign({}, i, {id: uuid()})),
					indent: 1
				});

				purpose.outputs.forEach(output => {
					tbody.sections.push({
						id: uuid(),
						name: output.description,
						indicators: output.indicators.map(i => Object.assign({}, i, {id: uuid()})),
						indent: 2
					});

					output.activities.forEach(activity => {
						tbody.sections.push({
							id: uuid(),
							name: activity.description,
							indicators: activity.indicators.map(i => Object.assign({}, i, {id: uuid()})),
							indent: 2
						});
					});
				});
			});

			return tbody;
		}

		_ccIndicatorsToTbody() {
			const tbody = {
				name: 'indicator.cross_cutting',
				sections: []
			};

			// Create a category with indicators that match project on 2 thematics or more
			const manyThematicsIndicators = this.ccIndicators.filter(indicator => {
				const commonThemes = indicator.themes.filter(themeId => this.project.themes.includes(themeId));
				return indicator.themes.length > 1 && commonThemes.length > 0;
			});

			if (manyThematicsIndicators.length)
				tbody.sections.push({
					id: uuid(),
					name: 'project.multi_theme_indicator',
					indicators: manyThematicsIndicators
				});

			// Create a category with indicators that match project on exactly 1 thematic
			this.themes.forEach(theme => {
				if (this.project.themes.includes(theme._id)) {
					var themeIndicators = this.ccIndicators.filter(i => i.themes.length === 1 && i.themes[0] === theme._id);
					if (themeIndicators.length !== 0)
						tbody.sections.push({
							id: theme._id,
							name: theme.name[this.language],
							indicators: themeIndicators
						});
				}
			});

			// sort and replace indicators by their 'planning' (from the project)
			tbody.sections.forEach(section => {
				section.indicators = section.indicators.map(ccIndicator => {
					return Object.assign(
						{},
						{id: ccIndicator._id, display: ccIndicator.name[this.language], baseline: null, target: null},
						this.project.crossCutting[ccIndicator._id]
					);
				});

				section.indicators.sort((a, b) => a.display.localeCompare(b.display));
			});

			return tbody;
		}

		_extraIndicatorsToTbody() {
			return {
				name: 'indicator.extra',
				sections: [
					{
						id: uuid(),
						indicators: this.project.extraIndicators.map(ind => {
							return Object.assign({}, ind, {id: uuid()})
						})
					}
				]
			};
		}

		_dataSourceToTbody(dataSource) {
			return {
				prefix: 'project.collection_form',
				name: dataSource.name,
				sections: [
					{
						id: dataSource.id,
						indicators: dataSource.elements.map(variable => {
							// create fake indicators from the variables
							return {
								id: variable.id,
								colorization: false,
								baseline: null,
								target: null,
								display: variable.name,
								computation: {
									formula: 'a',
									parameters: {
										a: {
											elementId: variable.id,
											filter: {}
										}
									}
								}
							};
						})
					}
				]
			};
		}

		_computeColumns() {
			const timeGroupBy = [
				'year', 'semester', 'quarter', 'month',
				'week_sat', 'week_sun', 'week_mon',
				'month_week_sat', 'month_week_sun', 'month_week_mon',
				'day'
			];

			if (timeGroupBy.includes(this.groupBy)) {
				const [start, end] = [this.filter._start, this.filter._end];

				const slots = Array.from(
					timeSlotRange(
						TimeSlot.fromDate(new Date(start + 'T00:00:00Z'), this.groupBy),
						TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), this.groupBy)
					)
				);

				return [
					...slots.map(slot => {
						return {
							id: slot.value,
							name: this._formatSlot(slot.value),
							title: this._formatSlotRange(slot.value)
						};
					}),
					{id:'_total', name: "Total"}
				];
			}

			else if (this.groupBy === 'entity')
				return [
					...this.project.entities.filter(e => this.filter.entity.includes(e.id)),
					{id: '_total', name: 'Total'}
				];

			else if (this.groupBy === 'group')
				// keep groups that contain at least on of the entities we are filtering on.
				return this.project.groups.filter(g => g.members.some(e => this.filter.entity.includes(e)));

			else
				throw new Error('Invalid groupBy: ' + this.groupBy)
		}

	}
});


export default module;
