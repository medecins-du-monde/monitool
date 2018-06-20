
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

			// tbodies.push(...this.project.logicalFrames.map(lf => this._logicalFrameworkToTbody(lf));
			tbodies.push(this._ccIndicatorsToTbody());
			// tbodies.push(this._extraIndicatorsToTbody());
			// tbodies.push(...this.project.forms.map(ds => this._dataSourceToTbody(ds));

			return tbodies;
		}

		_logicalFrameworkToTbody(logicalFramework) {
			const tbody = {
				prefix: 'project.logical_frame',
				name: 'indicator.cross_cutting',
				indicators: []
			};
		}

		_ccIndicatorsToTbody() {

			return {
				name: 'indicator.cross_cutting',
				sections: [
					{
						indent: 0,
						title: 'prout',
						indicators: [
							this.project.extraIndicators[0]
						]
					},
					{
						indent: 0,
						title: 'prout',
						indicators: [
						]
					}
				]

			}



			// cc indicators.
			const tbody = {name: 'indicator.cross_cutting', indicators: []};

			const newIndicators = [];
			for (let ccIndicatorId in this.project.crossCutting) {
				const newIndicator = angular.copy(this.project.crossCutting[ccIndicatorId]);
				newIndicator.id = ccIndicatorId;
				newIndicator.display = this.ccIndicators.find(i => i._id == ccIndicatorId).name[this.language];
				tbody.indicators.push(newIndicator);
			}

			return tbody;
		}

		_extraIndicatorsToTbody() {
			return {
				name: 'indicator.extra',
				indicators: this.project.extraIndicators.map(ind => {
					return Object.assign({}, ind, {id: uuid()})
				})
			};
		}

		_dataSourceToTbody(dataSource) {
			return {
				prefix: 'project.collection_form',
				name: dataSource.name,
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
