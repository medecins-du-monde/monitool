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
import uuid from 'uuid/v4';

import uiRouter from '@uirouter/angularjs';
import uiModal from 'angular-ui-bootstrap/src/modal/index';
import uiSelect from 'ui-select';

import 'ui-select/dist/select.min.css';

import mtIndicatorModel from '../../../services/models/indicator';
import mtThemeModel from '../../../services/models/theme';
import mtGoogleTranslation from '../../../services/utils/translate';


const module = angular.module(
	'monitool.pages.admin.indicatorlist',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal
		uiSelect, // for <ui-select>

		mtIndicatorModel.name,
		mtThemeModel.name,
		mtGoogleTranslation.name
	]
);


module.config(function($stateProvider) {

	if (window.user.type == 'user' && window.user.role == 'admin') {

		$stateProvider.state('main.admin.indicator_list', {
			url: '/admin/indicators',
			template: require('./list.html'),
			controller: 'AdminIndicatorListController',
			resolve: {
				indicators: function(Indicator) {
					return Indicator.query().$promise;
				},
				themes: function(Theme) {
					return Theme.query().$promise;
				}
			}
		});
	}
});


module.controller("AdminIndicatorListController", function($scope, $uibModal, Indicator, indicators, themes) {
	$scope.indicators = indicators;
	$scope.themes = themes;

	// give a color to each theme
	// give to indicators the color of the first theme
	var classes = ["text-primary", "text-success", "text-info", "text-warning", "text-danger"];
	$scope.themes.forEach(function(theme, index) { theme.class = classes[index % classes.length]; });

	var sortIndicators = function() {
		$scope.themes.sort(function(a, b) {
			return a.name[$scope.language].localeCompare(b.name[$scope.language]);
		});

		$scope.indicators.sort(function(a, b) {
			return a.name[$scope.language].localeCompare(b.name[$scope.language]);
		});
	};
	sortIndicators();

	var createModal = function(indicator, isNew) {
		return $uibModal.open({
			controller: 'IndicatorEditModalController',
			template: require('./edit-modal.html'),
			size: 'lg', scope: $scope,
			resolve: {
				themes: function() { return themes; },
				indicator: function() { return indicator; },
				isNew: function() { return isNew; }
			}
		}).result;
	};

	$scope.$watch('language', sortIndicators);

	$scope.create = function() {
		var indicator = new Indicator();
		indicator._id = 'indicator:' + uuid();
		indicator.reset();

		createModal(indicator, true)
			.then(function(action) {
				if (action === '$save') {
					$scope.indicators.push(indicator);
					sortIndicators();
					indicator.$save();
				}
			});
	};

	$scope.edit = function(indicator) {
		var backup = angular.copy(indicator);

		createModal(indicator, false)
			.then(function(action) {
				indicator[action]();
				if (action === '$save')
					sortIndicators();

				if (action === '$delete')
					$scope.indicators.splice($scope.indicators.indexOf(indicator), 1);
			})
			.catch(function() {
				angular.copy(backup, indicator);
			})
	};
});


module.controller('IndicatorEditModalController', function($uibModalInstance, $scope, googleTranslation, indicator, themes, isNew) {
	$scope.indicator = indicator;
	$scope.master = angular.copy(indicator);
	$scope.themes = themes;
	$scope.isNew = isNew;

	var indicatorWatch = $scope.$watch('indicator', function() {
		$scope.indicatorChanged = !angular.equals($scope.master, $scope.indicator);
		$scope.indicatorSavable = $scope.indicatorChanged && !$scope.indicatorForm.$invalid;
	}, true);

	// Form actions
	$scope.save = function() {
		if (!$scope.indicatorSavable)
			return;

		$uibModalInstance.close('$save');
	};

	$scope.translate = function(key, destLanguage) {
		for (var sourceLanguage in $scope.languages) {
			var source = indicator[key][sourceLanguage];

			if (sourceLanguage != destLanguage && source && source.length) {
				googleTranslation
					.translate(source, destLanguage, sourceLanguage)
					.then(function(result) {
						indicator[key][destLanguage] = result;
					});

				break;
			}
		}
	};

	$scope.delete = function() {
		$uibModalInstance.close('$delete');
	};

	$scope.cancel = function() {
		$uibModalInstance.dismiss();
	};
});

export default module;
