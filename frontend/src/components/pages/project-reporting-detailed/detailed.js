

import angular from 'angular';

import mtSelectIndicator from '../../shared/reporting/select-indicator';

import mtIndicatorFilter from '../../shared/reporting/indicator-filter';
import mtIndicatorGroupBy from '../../shared/reporting/indicator-group-by';
import mtIndicatorUnit from '../../../filters/indicator';
import mtTableIndicator from './table-indicator';

const module = angular.module(
	'monitool.components.pages.project.reporting-detailed',
	[
		mtSelectIndicator.name,
		mtIndicatorFilter.name,
		mtIndicatorGroupBy.name,
		mtIndicatorUnit.name,
		mtTableIndicator.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.reporting_detailed', {
		url: '/detailed',
		component: 'detailedReporting'
	});

});


module.component('detailedReporting', {
	bindings: {
		project: '<',
		ccIndicators: '<'
	},
	template: require('./detailed.html'),

	controller: class DetailedReportingController {

		onIndicatorUpdated(indicator, logicalFramework) {
			this.indicator = indicator;
		}

		onFilterUpdated(filter) {
			this.filter = filter;
		}

		onGroupByUpdated(groupBy) {
			this.groupBy = groupBy;
		}

	}

});


export default module;

