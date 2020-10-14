

import angular from 'angular';

import mtReportingField from './td-reporting-field';
import mtIndicatorUnit from '../../../filters/indicator';
import {fetchData, computeSplitPartitions, generateIndicatorDimensions} from '../../../helpers/indicator';

const module = angular.module(
	'monitool.components.pages.project.reporting.indicator-row',
	[
		mtReportingField,
		mtIndicatorUnit
	]
);


module.directive('trIndicator', () => {
	return {
		controllerAs: '$ctrl',
		restrict: 'A',
		scope: {}, // Isolate

		bindToController: {
			project: '<',
			columns: '<',
			groupBy: '<',
			filter: '<',
			indicator: '<',
			split: '<',
			firstColStyle: '<',

			onSplitToggle: '&',
			onPlotToggle: '&',

			//tmp
			name: '<',
			isGroup: '<'
		},

		template: require('./tr-indicator.html'),

		controller: class IndicatorRowController {

			constructor($scope, $timeout) {
				this.$scope = $scope;
				this.$timeout = $timeout;
			}

			$onChanges(changes) {
				const redraw = changes.groupBy ||
					(changes.indicator && !angular.equals(changes.indicator.previousValue, changes.indicator.currentValue)) ||
					(changes.filter && !angular.equals(changes.filter.previousValue, changes.filter.currentValue)) ||
					(changes.columns && !angular.equals(changes.columns.previousValue, changes.columns.currentValue));

				if (redraw && !this._refreshWaiting) {
					this.availableDimensions = generateIndicatorDimensions(this.project, this.indicator, this.filter).filter(dim => !dim.exclude.includes(this.groupBy))

					this.values = null;

					this.$timeout(this._fetchData.bind(this), 100);
					this._refreshWaiting = true;
				}
			}

			$onDestroy() {
				if (this.graphToggled)
					this.onPlotToggle({data: null});
			}

			toggleSplit(partitionId) {
				this.onSplitToggle({partitionId: partitionId})
			}

			toggleGraph() {
				if (this.graphToggled)
					this.onPlotToggle({data: null});
				else
					this.onPlotToggle({name: this.name, data: this._data});

				this.graphToggled = !this.graphToggled;
			}

			async _fetchData() {
				this._refreshWaiting = false;
				this.errorMessage = 'shared.loading';
				this.values = null;

				try {
					this._data = await fetchData(
						this.project,
						this.indicator.computation,
						[this.groupBy],
						this.filter,
						true,
						false
					);

					this.errorMessage = null;
					this.values = this.columns.map(col => this._data[col.id]);
					if (this.graphToggled)
						this.onPlotToggle({name: this.name, data: this._data});
				}
				catch (e) {
					this.errorMessage = e.message;
					this.onPlotToggle({data: null});
				}

				this.$scope.$apply();
			}


		}
	};
});

export default module.name;
