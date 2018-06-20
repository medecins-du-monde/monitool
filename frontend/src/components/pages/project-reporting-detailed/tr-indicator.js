
import angular from 'angular';
import mtTdReportingField from '../../shared/reporting/td-reporting-field';


const module = angular.module(
	'monitool.components.pages.project-reporting-detailed.tr-indicator',
	[
		mtTdReportingField.name
	]
);

module.directive('trIndicatorDetailed', () => {
	return {
		controllerAs: '$ctrl',
		restrict: 'A',
		scope: {}, // Isolate

		bindToController: {
			slots: '<',
			sectionTitle: '<',
			errorMessage: '<',
			values: '<',
			indicator: '<'
		},

		template: require('./tr-indicator.html'),

		controller: class TrIndicatorController {
		}
	};
});


export default module;