
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
			indicator: '<',
			firstColStyle: '<',

			onPlotToggle: '&'
		},

		template: require('./tr-indicator.html'),

		controller: class TrIndicatorController {


			$onChanges(changes) {
				// FIXME this is a big hack
				// we are rebuilding the original hashmap from the two arrays that are passed
				// from the parent component.
				// This is just wrong: the whole table-indicator, tr-indicator, etc components should
				// be deleted in favour of not duplicating so much code between 'general reporting' and 'detailed reporting'
				if (changes.values || changes.slots) {
					if (this.values && this.slots) {
						this._graphValues = {};
						this.slots.forEach((slot, index) => this._graphValues[slot] = this.values[index]);
					}
					else
						this._graphValues = null;
				}

				if (changes.values && this.graphToggled)
					this.onPlotToggle({name: this.sectionTitle, data: this._graphValues})
			}

			toggleGraph() {
				if (this.graphToggled)
					this.onPlotToggle({data: null});
				else
					this.onPlotToggle({name: this.sectionTitle, data: this._graphValues})

				this.graphToggled = !this.graphToggled;
			}

			$onDestroy() {
				if (this.graphToggled)
					this.onPlotToggle({data: null});
			}

		}
	};
});


export default module;