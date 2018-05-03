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
import uiModal from 'angular-ui-bootstrap/src/modal/index';
import uuid from 'uuid/v4';

import mtThemeModel from '../../../services/models/theme';
import mtGoogleTranslation from '../../../services/utils/translate';

const module = angular.module(
	'monitool.pages.admin.themelist',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal

		mtThemeModel.name,
		mtGoogleTranslation.name
	]
);


module.config(function($stateProvider) {

	if (window.user.type == 'user' && window.user.role == 'admin') {
		$stateProvider.state('main.admin.theme_list', {
			url: '/admin/themes',
			template: require('./list.html'),
			controller: 'ThemeListController',
			resolve: {
				themes: function(Theme) {
					return Theme.query().$promise;
				}
			}
		});
	}
});


module.controller('ThemeListController', function($scope, $uibModal, Theme, themes) {
	var sortThemes = function() {
		$scope.themes.sort((a, b) => {
			return a.name[$scope.language].localeCompare(b.name[$scope.language]);
		});
	};

	var createModal = function(theme, isNew) {
		return $uibModal.open({
			controller: 'ThemeEditModalController',
			template: require('./edit-modal.html'),
			size: 'lg', scope: $scope,
			resolve: {
				theme: function() { return theme; },
				isNew: function() { return isNew; }
			}
		}).result;
	};

	$scope.themes = themes;
	$scope.$watch('language', sortThemes);

	$scope.create = function() {
		var theme = new Theme();
		theme._id = 'theme:' + uuid();
		theme.reset();

		createModal(theme, true)
			.then(function(action) {
				if (action === '$save') {
					$scope.themes.push(theme);
					sortThemes();
					theme.$save();
				}
			});
	};

	$scope.edit = function(theme) {
		var backup = angular.copy(theme);

		createModal(theme, false)
			.then(function(action) {
				theme[action]();
				if (action === '$save')
					sortThemes();

				if (action === '$delete')
					$scope.themes.splice($scope.themes.indexOf(theme), 1);
			})
			.catch(function() {
				angular.copy(backup, theme);
			})
	};
});


module.controller('ThemeEditModalController', function($scope, $uibModalInstance, theme, isNew, googleTranslation) {
	$scope.theme = theme;
	$scope.isNew = isNew;
	$scope.master = angular.copy(theme);

	$scope.$watch('theme', function() {
		$scope.hasChanged = !angular.equals($scope.theme, $scope.master);
	}, true);

	$scope.save = function() {
		$uibModalInstance.close('$save');
	};

	$scope.delete = function() {
		$uibModalInstance.close('$delete');
	};

	$scope.cancel = function() {
		$uibModalInstance.dismiss();
	};

	$scope.autofill = function(writeLanguageCode) {
		for (var readLanguageCode in $scope.languages) {
			var input = $scope.theme.name[readLanguageCode];

			if (readLanguageCode !== writeLanguageCode && input.length) {
				googleTranslation.translate(input, writeLanguageCode, readLanguageCode).then(function(result) {
					$scope.theme.name[writeLanguageCode] = result;
				});

				break;
			}
		}
	}
});

export default module;