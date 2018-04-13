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

"use strict";

angular
	.module(
		'monitool.controllers.admin',
		[

		]
	)

	.controller('UserListController', function($scope, $uibModal, users) {
		$scope.$watch('userCtx', function(userCtx) {
			if (!userCtx)
				return;

			$scope.users = users.filter(function(user) { return user._id !== userCtx._id; });
			$scope.users.sort(function(a, b) { return a._id < b._id ? -1 : 1; });
		});

		$scope.edit = function(user) {
			var backup = angular.copy(user);
			var promise = $uibModal.open({
				controller: 'UserEditModalController',
				templateUrl: 'partials/admin/user-edit-modal.html',
				size: 'lg',
				scope: $scope,
				resolve: { user: function() { return user; } }
			}).result;

			promise
				.then(function() { user.$save(); })
				.catch(function() { angular.copy(backup, user); })
		};
	})

	.controller("UserEditModalController", function($scope, $uibModalInstance, user) {
		$scope.user = user;
		$scope.master = angular.copy(user);

		$scope.$watch('user', function() {
			$scope.hasChanged = !angular.equals($scope.user, $scope.master);
		}, true);

		$scope.save = function() {
			$uibModalInstance.close();
		};

		$scope.cancel = function() {
			$uibModalInstance.dismiss();
		};
	})

	.controller('ThemeListController', function($scope, $uibModal, Theme, uuid, themes) {
		var sortThemes = function() {
			$scope.themes.sort(function(a, b) {
				return a.name[$scope.language].localeCompare(b.name[$scope.language]);
			});
		};

		var createModal = function(theme, isNew) {
			return $uibModal.open({
				controller: 'ThemeEditModalController',
				templateUrl: 'partials/admin/theme-edit-modal.html',
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
			theme._id = uuid.v4();
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
	})

	.controller('ThemeEditModalController', function($scope, $uibModalInstance, theme, isNew, googleTranslation) {
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
	})

	.controller("AdminIndicatorListController", function($scope, $uibModal, Indicator, uuid, indicators, themes) {
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
				templateUrl: 'partials/admin/indicator-edit-modal.html',
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
			indicator._id = uuid.v4();
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
	})

	.controller('IndicatorEditModalController', function($uibModalInstance, $scope, googleTranslation, indicator, themes, isNew) {
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
	})