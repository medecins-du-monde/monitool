"use strict";

angular
	.module('monitool.services.models.project', ['ngResource'])
	.factory('Project', function($resource, $q, $rootScope, uuid) {

		var Project = $resource('/resources/project/:id', { id: "@_id" }, { save: { method: "PUT" }});

		
		/**
		 * Does it makes sense to display a link for activity reporting?
		 */
		Project.prototype.hasActivityReporting = function() {
			for (var formIndex = 0; formIndex < this.forms.length; ++formIndex)
				if (this.forms[formIndex].elements.length)
					if (this.entities.length || this.forms[formIndex].collect == 'project')
						return true;

			return false;
		};

		/**
		 * Does it makes sense to display a link for objective reporting?
		 */
		Project.prototype.hasObjectiveReporting = function() {
			for (var lfIndex = 0; lfIndex < this.logicalFrames.length; ++lfIndex) {
				if (this.logicalFrames[lfIndex].indicators.length)
					return true;

				for (var pIndex = 0; pIndex < this.logicalFrames[lfIndex].purposes.length; ++pIndex) {
					if (this.logicalFrames[lfIndex].purposes[pIndex].indicators.length)
						return true;

					for (var oIndex = 0; oIndex < this.logicalFrames[lfIndex].purposes[pIndex].outputs.length; ++oIndex)
						if (this.logicalFrames[lfIndex].purposes[pIndex].outputs[oIndex].indicators.length)
							return true;
				}
			}

			return false;
		};

		/**
		 * Retrieve the list of all linked indicator ids.
		 */
		Project.prototype.getLinkedIndicatorIds = function() {
			var projectIndicators = {};
			this.logicalFrames.forEach(function(logicalFrame) {
				logicalFrame.indicators.forEach(function(i) { i.indicatorId && (projectIndicators[i.indicatorId] = true); });
				logicalFrame.purposes.forEach(function(purpose) {
					purpose.indicators.forEach(function(i) { i.indicatorId && (projectIndicators[i.indicatorId] = true); });
					purpose.outputs.forEach(function(output) {
						output.indicators.forEach(function(i) { i.indicatorId && (projectIndicators[i.indicatorId] = true); });
					});
				});
			});

			return Object.keys(projectIndicators);
		};

		/**
		 * Retrieve indicator planning by indicatorId.
		 */
		Project.prototype.getIndicatorPlanningById = function(indicatorId) {
			var planning;

			for (var lfIndex = 0; lfIndex < this.logicalFrames.length; ++lfIndex) {
				var logicalFrame = this.logicalFrames[lfIndex];
				
				planning = logicalFrame.indicators.find(function(i) { return i.indicatorId === indicatorId; });
				if (planning)
					return planning;

				for (var pIndex = 0; pIndex < logicalFrame.purposes.length; ++pIndex) {
					var purpose = logicalFrame.purposes[pIndex];

					planning = purpose.indicators.find(function(i) { return i.indicatorId === indicatorId; });
					if (planning)
						return planning;

					for (var oIndex = 0; oIndex < purpose.outputs.length; ++oIndex) {
						planning = purpose.outputs[oIndex].indicators.find(function(i) { return i.indicatorId === indicatorId; });
						if (planning)
							return planning;
					}
				}
			}

			return null;
		};

		/**
		 * Add an entity to the project.
		 */
		Project.prototype.createEntity = function() {
			this.entities.push({id: uuid.v4(), name: '', start: null, end: null});
		};
		
		/**
		 * Remove an entity from the project, with all related dependencies.
		 */
		Project.prototype.removeEntity = function(entityId) {
			// Remove from entities
			this.entities = this.entities.filter(function(e) { return e.id !== entityId; });
			
			// Remove from groups
			this.groups.forEach(function(group) {
				var index = group.members.indexOf(entityId);
				if (index !== -1)
					group.members.splice(index, 1);
			});

			// Remove from users
			this.users.forEach(function(user) {
				if (user.entities) {
					var index = user.entities.indexOf(entityId);
					if (index !== -1) {
						user.entities.splice(index, 1);
						if (user.entities.length == 0) {
							user.role = 'read';
							delete user.entities;
						}
					}
				}
			});

			// Remove from forms
			this.forms.forEach(function(form) {
				if (form.entities) {
					var index = form.entities.indexOf(entityId);
					if (index !== -1)
						form.entities.splice(index, 1);
				}
			});
		};


		/**
		 * Add a group to the project.
		 */
		 Project.prototype.createGroup = function() {
			this.groups.push({id: uuid.v4(), name: '', members: []});
		};

		/**
		 * Remove a group from the project, with all related dependencies.
		 */
		Project.prototype.removeGroup = function(groupId) {
			this.groups = this.groups.filter(function(group) { return group.id !== groupId; });
		};

		/**
		 * Clone project
		 */
		Project.prototype.clone = function(newName) {
			// change all ids, just in case
			var old2new = {};

			var newProject = angular.copy(this);
			newProject._id = uuid.v4();
			newProject.name = newName;
			delete newProject._rev;
			newProject.users = [{type: "internal", id: $rootScope.userCtx._id, role: "owner"}];

			newProject.entities.forEach(function(entity) {
				old2new[entity.id] = uuid.v4();
				entity.id = old2new[entity.id];
			});

			newProject.groups.forEach(function(group) {
				old2new[group.id] = uuid.v4();
				group.id = old2new[group.id];
				group.members = group.members.map(function(oldId) { return old2new[oldId]; });
			});

			newProject.forms.forEach(function(form) {
				old2new[form.id] = uuid.v4();
				form.id = old2new[form.id];

				form.elements.forEach(function(element) {
					old2new[element.id] = uuid.v4();
					element.id = old2new[element.id];

					element.partitions.forEach(function(partition) {
						old2new[partition.id] = uuid.v4();
						partition.id = old2new[partition.id];

						partition.elements.forEach(function(pElement) {
							old2new[pElement.id] = uuid.v4();
							pElement.id = old2new[pElement.id];
						});

						partition.groups.forEach(function(pGroup) {
							old2new[pGroup.id] = uuid.v4();
							pGroup.id = old2new[pGroup.id];
							pGroup.members = pGroup.members.map(function(oldId) { return old2new[oldId]; });
						});
					});
				});

				if (form.collect == 'some_entity') {
					form.entities = form.entities.map(function(oldId) { return old2new[oldId]; });
				}
			});

			var updateIndicator = function(indicator) {
				for (var key in indicator.parameters) {
					var param = indicator.parameters[key];

					param.elementId = old2new[param.elementId] || null;
					var newFilter = {};
					for (key in param.filter)
						newFilter[old2new[key]] = param.filter[key].map(function(i) { return old2new[i]; });
					param.filter = newFilter;
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

			return newProject;
		};

		/**
		 * ACLS
		 */
		Project.prototype.canEditInputsOnEntity = function(entityId) {
			var user = $rootScope.userCtx,
				projectUser = this.users.find(function(u) {
					return (user.type == 'user' && u.id == user._id) ||
						   (user.type == 'partner' && u.username == user.username);
				});

			if (user.type == 'user' && user.roles.indexOf('_admin') !== -1)
				return true;

			else if (!projectUser)
				return false;

			else {
				var role = projectUser.role;
				if (role === 'owner' || role === 'input_all')
					return true;
				else if (role === 'input')
					return projectUser.entities.indexOf(entityId) !== -1;
				else if (role === 'read')
					return false;
				else
					throw new Error('invalid role');
			}
		};

		Project.prototype.reset = function() {
			this.type = "project";
			this.name = "";
			this.start = new Date();
			this.end = new Date();
			this.themes = [];
			this.logicalFrames = [];
			this.entities = [];
			this.groups = [];
			this.forms = [];
			this.users = [];
		}

		return Project;
	});