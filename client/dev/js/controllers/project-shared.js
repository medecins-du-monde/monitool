"use strict";

angular.module('monitool.controllers.project.shared', [])

	.controller('ProjectListController', function($scope, projects, themes) {
		$scope.themes = themes;
		$scope.pred = 'name'; // default sorting predicate

		$scope.myProjects = projects.filter(function(p) {
			return p.users.find(function(u) { return u.id == $scope.userCtx._id; });
		});

		$scope.runningProjects = projects.filter(function(p) {
			return $scope.myProjects.indexOf(p) === -1 && p.end >= new Date()
		});
		
		$scope.finishedProjects = projects.filter(function(p) {
			return $scope.myProjects.indexOf(p) === -1 && p.end < new Date()
		});

		$scope.projects = $scope.myProjects;
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, $filter, project) {
		if ($stateParams.projectId === 'new') {
			project.users.push({
				type: "internal",
				id: $scope.userCtx._id,
				role: "owner"
			});
		}

		$scope.project = project;
		$scope.master = angular.copy(project);

		$scope.cloneProject = function() {
			var translate = $filter('translate'),
				question  = translate('project.please_enter_new_name');

			var newName = window.prompt(question),
				newProject = angular.copy($scope.project);

			if (!newName)
				return;

			// change all ids, just in case
			var old2new = {};
			newProject._id = makeUUID();
			newProject.name = newName;
			delete newProject._rev;
			newProject.users = [{type: "internal", id: $scope.userCtx._id, role: "owner"}];

			newProject.entities.forEach(function(entity) {
				old2new[entity.id] = makeUUID();
				entity.id = old2new[entity.id];
			});

			newProject.groups.forEach(function(group) {
				old2new[group.id] = makeUUID();
				group.id = old2new[group.id];
				group.members = group.members.map(function(oldId) { return old2new[oldId]; });
			});

			newProject.forms.forEach(function(form) {
				old2new[form.id] = makeUUID();
				form.id = old2new[form.id];

				form.elements.forEach(function(element) {
					old2new[element.id] = makeUUID();
					element.id = old2new[element.id];

					element.partitions.forEach(function(partition) {
						partition.forEach(function(pElement) {
							old2new[pElement.id] = makeUUID();
							pElement.id = old2new[pElement.id];
						});
					});
				});
			});

			var updateIndicator = function(indicator) {
				for (var key in indicator.parameters) {
					var param = indicator.parameters[key];

					param.elementId = old2new[param.elementId];
					for (key in param.filter)
						param.filter[key] = param.filter[key].map(function(i) { return old2new[i]; });
				}
			};

			newProject.logicalFrames.forEach(function(logframe) {
				logframe.indicators.forEach(updateIndicator);
				logframe.purposes.forEach(function(purpose) {
					purpose.indicators.forEach(updateIndicator);
					purpose.outputs.forEach(function(output) {
						output.indicators.forEach(updateIndicator);
					});
				});
			});

			newProject.$save()
				.then(function() { $state.go('main.projects'); })
				.catch(function(error) { $scope.error = error; });
		};

		$scope.deleteProject = function() {
			var translate = $filter('translate'),
				question  = translate('project.are_you_sure_to_delete'),
				answer    = translate('project.are_you_sure_to_delete_answer');

			if (window.prompt(question) === answer) {
				menuWatch();
				pageChangeWatch();

				project.$delete(function() {
					$state.go('main.projects');
				});
			}
		};

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function() {
			if ($stateParams.projectId === 'new')
				$scope.project._id = makeUUID();

			return $scope.project.$save().then(function() {
				$scope.master = angular.copy($scope.project);
				
				if ($stateParams.projectId === 'new')
					$state.go('main.project.basics', {projectId: $scope.project._id});
			}).catch(function(error) {
				$scope.error = error;
			});
		};

		var menuWatch = $scope.$watch('project', function(project) {
			$scope.projectHasIndicators = false;

			outerloop:
				for (var lfIndex = 0; lfIndex < project.logicalFrames.length; ++lfIndex) {
					if (project.logicalFrames[lfIndex].indicators.length) {
						$scope.projectHasIndicators = true;
						break outerloop;
					}

					for (var pIndex = 0; pIndex < project.logicalFrames[lfIndex].purposes.length; ++pIndex) {
						if (project.logicalFrames[lfIndex].purposes[pIndex].indicators.length) {
							$scope.projectHasIndicators = true;
							break outerloop;
						}

						for (var oIndex = 0; oIndex < project.logicalFrames[lfIndex].purposes[pIndex].outputs.length; ++oIndex) {
							if (project.logicalFrames[lfIndex].purposes[pIndex].outputs[oIndex].indicators.length) {
								$scope.projectHasIndicators = true;
								break outerloop;
							}
						}
					}
				}

			$scope.projectHasFormElements = false;
			project.forms.forEach(function(form) {
				if (form.elements.length)
					$scope.projectHasFormElements = true;
			});
		}, true);

		// is this still useful?
		$scope.$on('languageChange', function(e) {
			// @hack that will make copies of all dates, and force datepickers to redraw...
			$scope.project = angular.copy($scope.project);
		});

		$scope.reset = function() {
			$scope.project = angular.copy($scope.master);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.project);
		};

		// We restore $scope.master on $scope.project to avoid unsaved changes from a given tab to pollute changes to another one.
		var pageChangeWatch = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			var pages = ['main.project.logical_frame', 'main.project.collection_site_list', 'main.project.basics', 'main.project.user_list'];

			// if unsaved changes were made
			if (pages.indexOf(fromState.name) !== -1 && !angular.equals($scope.master, $scope.project)) {
				// then ask the user if he meant it
				if (window.confirm($filter('translate')('shared.sure_to_leave')))
					$scope.reset();
				else
					event.preventDefault();
			}
		});
	})
