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
import 'angular-legacy-sortablejs-maintained';

const module = angular.module(
	'monitool.pages.project.structure.extraindicator',
	[
		uiRouter, // for $stateProvider
		'ng-sortable'
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure.extra', {
		url: '/extra',
		template: require('./extra-indicators.html'),
		controller: 'ProjectExtraIndicators',
	});

});


module.controller('ProjectExtraIndicators', function($scope, $uibModal) {
	$scope.addIndicator = function() {
		var promise = $uibModal.open({
			controller: 'ProjectIndicatorEditionModalController',
			template: require('../../../../components/indicator/edition-modal.html'),
			size: 'lg',
			scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
			resolve: {planning: function() { return null; }, indicator: function() { return null; }}
		}).result;

		promise.then(function(newPlanning) {
			if (newPlanning)
				$scope.editableProject.extraIndicators.push(newPlanning);
		});
	};
});

export default module;

