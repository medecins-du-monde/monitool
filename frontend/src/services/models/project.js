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
	.module('monitool.services.models.project', ['ngResource'])
	.factory('Project', function($resource, $q, $rootScope, $filter, uuid, itertools, Parser) {

		var Project = $resource('/api/resources/project/:id', { id: "@_id" }, { save: { method: "PUT" }});

		/**
		 * Retrieve all indicators and variables in list
		 * eg: fill <select> on detailed reporting pages.
		 */
		Project.prototype.getAllIndicators = function(indicators) {
			var elementOptions = [];
			this.logicalFrames.forEach(function(logicalFrame, i0) {
				var fn = function(i) {
					return {
						logicalFrameIndex: i0,
						name: i.display,
						type: "indicator",
						group: $filter('translate')('project.logical_frame') + ": " + logicalFrame.name,
						indicator: i
					};
				};

				Array.prototype.push.apply(elementOptions, logicalFrame.indicators.map(fn));
				logicalFrame.purposes.forEach(function(purpose) {
					Array.prototype.push.apply(elementOptions, purpose.indicators.map(fn));
					purpose.outputs.forEach(function(output) {
						Array.prototype.push.apply(elementOptions, output.indicators.map(fn));
						output.activities.forEach(function(activity) {
							Array.prototype.push.apply(elementOptions, activity.indicators.map(fn));
						}, this);
					}, this);
				}, this);
			}, this);

			indicators.sort(function(a, b) { return a.name[$rootScope.language].localeCompare(b.name[$rootScope.language]); });
			indicators.forEach(function(indicator) {
				if (itertools.intersect(indicator.themes, this.themes).length === 0)
					return;

				elementOptions.push({
					logicalFrameIndex: null,
					name: indicator.name[$rootScope.language],
					type: "indicator",
					group: $filter('translate')('indicator.cross_cutting'),
					indicator: this.crossCutting[indicator._id] || {
						display: indicator.name[$rootScope.language],
						baseline: null,
						target: null,
						computation: null
					}
				});
			}, this);

			this.extraIndicators.forEach(function(planning) {
				elementOptions.push({
					name: planning.display,
					type: "indicator",
					group: $filter('translate')('indicator.extra'),
					indicator: planning
				});
			});

			this.forms.forEach(function(form) {
				form.elements.forEach(function(element) {
					elementOptions.push({
						name: element.name,
						type: "variable",
						group: $filter('translate')('project.collection_form') + ": " + form.name,
						element: element,
						form: form
					});
				});
			});

			return elementOptions;
		};

		/**
		 * Does it makes sense to display links for input and reporting?
		 */
		Project.prototype.isReadyForReporting = function() {
			for (var formIndex = 0; formIndex < this.forms.length; ++formIndex) {
				var form = this.forms[formIndex];
				if (form.elements.length && form.entities.length)
					return true;
			}

			return false;
		}

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
			this.entities = this.entities.filter(function(e) { return e.id !== entityId; });
			this.sanitize();
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
		Project.prototype.clone = function(newName, userId) {
			var newProject = angular.copy(this);
			newProject._id = 'project:' + uuid.v4();
			newProject.name = newName; // Change name
			delete newProject._rev; // Delete revision
			newProject.users = [{type: "internal", id: userId, role: "owner"}]; // Change users

			return newProject;
		};

		Project.prototype.canInputForm = function(projectUser, formId) {
			if (!projectUser)
				return false;

			if (projectUser.role === 'owner')
				return true;

			if (projectUser.role === 'input') {
				// Check if user is explicitly forbidden
				if (projectUser.dataSources.indexOf(formId) === -1)
					return false;

				// Check if entities where user is allowed intersect with the data source.
				var form = this.forms.find(function(f) { return f.id == formId; });
				var userColumns = projectUser.entities;

				return !!itertools.intersect(form.entities, userColumns).length;
			}

			return false;
		};


		Project.prototype.reset = function() {
			var now = new Date().toISOString().substring(0, 10);

			this.type = "project";
			this.name = "";
			this.start = now;
			this.end = now;
			this.themes = [];
			this.crossCutting = {};
			this.extraIndicators = [];
			this.logicalFrames = [];
			this.entities = [];
			this.groups = [];
			this.forms = [];
			this.users = [];
			this.visibility = 'public';
		};


		/**
		 * Scan all references to variables, partitions and partitions elements
		 * inside a given indicator to ensure that there are no broken links
		 * and repair them if needed.
		 */
		Project.prototype.sanitizeIndicator = function(indicator) {
			if (indicator.computation === null)
				return;

			// try to retrive the symbols from the formula.
			var symbols = null;
			try {
				symbols = Parser.parse(indicator.computation.formula).variables();
			}
			catch (e) {
				// if we fail to retrieve symbols => computation is invalid.
				indicator.computation = null;
				return;
			}

			for (var key in indicator.computation.parameters) {
				// This key is useless.
				if (symbols.indexOf(key) === -1) {
					delete indicator.computation.parameters[key];
					continue;
				}

				var parameter = indicator.computation.parameters[key];
				var element = null;

				this.forms.forEach(function(f) {
					f.elements.forEach(function(e) {
						if (e.id === parameter.elementId)
							element = e;
					});
				});

				// Element was not found.
				if (!element) {
					indicator.computation = null;
					return;
				}

				for (var partitionId in parameter.filter) {
					var partition = element.partitions.find(function(p) { return p.id === partitionId; });
					if (!partition) {
						indicator.computation = null;
						return;
					}

					var elementIds = parameter.filter[partitionId];
					for (var i = 0; i < elementIds.length; ++i) {
						if (!partition.elements.find(function(e) { return e.id === elementIds[i]; })) {
							indicator.computation = null;
							return;
						}
					}
				}
			}
		};

		/**
		 * Scan references to entities and remove broken links
		 * If no valid links remain, change the user to read only mode
		 */
		Project.prototype.sanitizeUser = function(user) {
			if (user.role === 'input') {
				user.entities = user.entities.filter(function(entityId) {
					return !!this.entities.find(function(entity) { return entity.id === entityId; });
				}.bind(this));

				user.dataSources = user.dataSources.filter(function(dataSourceId) {
					return !!this.forms.find(function(form) { return form.id === dataSourceId; });
				}.bind(this));

				if (user.entities.length == 0 || user.dataSources.length == 0) {
					delete user.entities;
					delete user.dataSources;
					user.role = 'read';
				}
			}
			else {
				delete user.entities;
				delete user.dataSources;
			}
		};

		Project.prototype.sanitizeForm = function(form) {
			var entityIds = this.entities.pluck('id'),
				entityIdFilter = function(g) { return entityIds.indexOf(g) !== -1; };

			// Remove deleted entities
			form.entities = form.entities.filter(entityIdFilter);

			// Sanitize order and distribution
			form.elements.forEach(function(element) {
				if (element.distribution < 0 || element.distribution > element.partitions.length)
					element.distribution = Math.floor(element.partitions.length / 2);

				if (element.order < 0 || element.order >= Math.factorial(element.partitions.length))
					element.order = 0;
			});
		};

		/**
		 * Scan all internal references to entities, variables, partitions, and partitions elements
		 * inside the project to ensure that there are no broken links and repair them if needed.
		 */
		Project.prototype.sanitize = function(indicators) {

			if (this.visibility !== 'private' && this.visibility !== 'public')
				this.visibility = 'private';

			//////////////////
			// Sanitize links to input entities
			//////////////////

			var entityIds = this.entities.pluck('id'),
				entityIdFilter = function(g) { return entityIds.indexOf(g) !== -1; };

			// Filter groups members
			this.groups.forEach(function(group) {
				group.members = group.members.filter(entityIdFilter);
			});

			this.users.forEach(this.sanitizeUser, this);
			this.forms.forEach(this.sanitizeForm, this);

			/////////////
			// Sanitize links to variables from indicators
			/////////////

			this.logicalFrames.forEach(function(logicalFrame) {
				logicalFrame.indicators.forEach(this.sanitizeIndicator, this);
				logicalFrame.purposes.forEach(function(purpose) {
					purpose.indicators.forEach(this.sanitizeIndicator, this);
					purpose.outputs.forEach(function(output) {
						output.indicators.forEach(this.sanitizeIndicator, this);
						output.activities.forEach(function(activity) {
							activity.indicators.forEach(this.sanitizeIndicator, this);
						}, this);
					}, this);
				}, this);
			}, this);

			for (var indicatorId in this.crossCutting) {
				var indicator = indicators.find(function(i) { return i._id == indicatorId; });
				if (!indicator || itertools.intersect(indicator.themes, this.themes).length === 0)
					delete this.crossCutting[indicatorId];
				else
					this.sanitizeIndicator(this.crossCutting[indicatorId]);
			}

			this.extraIndicators.forEach(this.sanitizeIndicator, this);
		};

		return Project;
	});
