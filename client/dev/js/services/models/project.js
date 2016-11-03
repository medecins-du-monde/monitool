"use strict";

angular
	.module('monitool.services.models.project', ['ngResource'])
	.factory('Project', function($resource, $q, $rootScope, uuid, itertools) {

		var Project = $resource('/resources/project/:id', { id: "@_id" }, { save: { method: "PUT" }});

		/**
		 * Retrieve all indicators and variables in list
		 * eg: fill <select> on detailed reporting pages.
		 */
		Project.prototype.getAllIndicators = function(indicators) {
			var elementOptions = [];
			this.logicalFrames.forEach(function(logicalFrame, i0) {
				var fn = function(i) { return {name: i.display, type: "indicator", group: "Logical frame: " + logicalFrame.name, indicator: i}; };
				Array.prototype.push.apply(elementOptions, logicalFrame.indicators.map(fn));
				logicalFrame.purposes.forEach(function(purpose, i1) {
					Array.prototype.push.apply(elementOptions, purpose.indicators.map(fn));
					purpose.outputs.forEach(function(output, i2) {
						Array.prototype.push.apply(elementOptions, output.indicators.map(fn));
					}, this);
				}, this);
			}, this);

			for (var indicatorId in this.crossCutting) {
				var indicator = indicators.find(function(i) { return i._id == indicatorId; });
				elementOptions.push({
					name: indicator.name[$rootScope.language],
					type: "indicator",
					group: "Cross-Cutting Indicators",
					indicator: this.crossCutting[indicatorId]
				});
			}

			this.forms.forEach(function(form) {
				form.elements.forEach(function(element) {
					elementOptions.push({name: element.name, type: "variable", group: "Data source: " + form.name, element: element, form: form});
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
				
				if (form.elements.length) {
					var canInputAllEntities = form.collect == 'entity' && this.entities.length,
						canInputSomeEntities = form.collect == 'some_entity' && form.entities.length,
						canInputProject = form.collect == 'project';

					if (canInputAllEntities || canInputSomeEntities || canInputProject)
						return true;
				}
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
			// replace all uuids inside the project by new ones, to avoid collisions.
			var old2new = {};
			var strProject = angular.toJson(this).replace(/[\da-z]{8}-([\da-z]{4}-){3}-[\da-z]{12}/, function(match) {
				if (!old2new[match])
					old2new[match] = uuid.v4();
				return old2new[match];
			});

			// Create new project
			var newProject = new Project(JSON.parse(strProject));
			newProject.name = newName; // Change name
			delete newProject._rev; // Delete revision
			newProject.users = [{type: "internal", id: userId, role: "owner"}]; // Change users

			return newProject;
		};

		Project.prototype.canInputForm = function(projectUser, formId) {
			if (!projectUser)
				return false;

			if (projectUser.role === 'owner' || projectUser.role === 'input_all')
				return true;
			
			if (projectUser.role === 'input') {
				var form = this.forms.find(function(f) { return f.id == formId; });

				var formColumns;
				if (form.collect == 'project')
					formColumns = ['none'];
				else if (form.collect == 'some_entity')
					formColumns = form.entities;
				else if (form.collect == 'entity')
					formColumns = this.entities.pluck('id')

				var userColumns = projectUser.entities;

				return !!itertools.intersect(formColumns, userColumns).length;
			}
			
			return false;
		};



		/**
		 * Check if given user is allowed to make data inputs on a given input entity
		 */
		// Project.prototype.canEditInputsOnEntity = function(entityId) {
		// 	var user = $rootScope.userCtx,
		// 		projectUser = this.users.find(function(u) {
		// 			return (user.type == 'user' && u.id == user._id) ||
		// 				   (user.type == 'partner' && u.username == user.username);
		// 		});

		// 	if (user.type == 'user' && user.role === 'admin')
		// 		return true;

		// 	else if (!projectUser)
		// 		return false;

		// 	else {
		// 		var role = projectUser.role;
		// 		if (role === 'owner' || role === 'input_all')
		// 			return true;
		// 		else if (role === 'input')
		// 			return projectUser.entities.indexOf(entityId) !== -1;
		// 		else if (role === 'read')
		// 			return false;
		// 		else
		// 			throw new Error('invalid role');
		// 	}
		// };

		Project.prototype.reset = function() {
			this.type = "project";
			this.name = "";
			this.start = new Date(86400000 * Math.floor(Date.now() / 86400000));
			this.end = new Date(86400000 * Math.floor(Date.now() / 86400000));
			this.themes = [];
			this.crossCutting = {};
			this.logicalFrames = [];
			this.entities = [];
			this.groups = [];
			this.forms = [];
			this.users = [];
		};


		/**
		 * Scan all references to variables, partitions and partitions elements
		 * inside a given indicator to ensure that there are no broken links
		 * and repair them if needed.
		 */
		Project.prototype.sanitizeIndicator = function(indicator) {
			if (indicator.computation === null)
					return;

			for (var key in indicator.computation.parameters) {
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
		 * Scan all internal references to entities, variables, partitions, and partitions elements
		 * inside the project to ensure that there are no broken links and repair them if needed.
		 */
		Project.prototype.sanitize = function() {
			//////////////////
			// Sanitize links to input entities
			//////////////////

			var entityIds = this.entities.pluck('id'),
				entityIdFilter = function(g) { return entityIds.indexOf(g) !== -1; };

			// Filter groups members
			this.groups.forEach(function(group) {
				group.members = group.members.filter(entityIdFilter);
			});

			this.users.forEach(function(user) {
				if (user.entities)
					user.entities = user.entities.filter(entityIdFilter);
			});

			this.forms.forEach(function(form) {
				if (user.entities)
					form.entities = form.entities.filter(entityIdFilter);
			});

			/////////////
			// Sanitize links to variables from indicators
			/////////////

			this.logicalFrames.forEach(function(logicalFrame) {
				logicalFrame.indicators.forEach(this.sanitizeIndicator, this);
				logicalFrame.purposes.forEach(function(purpose) {
					purpose.indicators.forEach(this.sanitizeIndicator, this);
					purpose.outputs.forEach(function(output) {
						output.indicators.forEach(this.sanitizeIndicator, this);
					}, this);
				}, this);
			}, this);

			for (var key in this.crossCutting)
				this.sanitizeIndicator(this.crossCutting[key]);
		};

		return Project;
	});


			// Sanitize order and distribution
			//
			// this.forms.forEach(function(form) {
			// 	form.elements.forEach(function(element) {
			// 		if (element.distribution < 0 || element.distribution > element.partitions.length)
			// 			element.distribution = 0;
			//
			// 		if (element.order < 0 || element.order >= Math.factorial(element.partitions.length))
			// 			element.order = 0;
			// 	});
			// });
