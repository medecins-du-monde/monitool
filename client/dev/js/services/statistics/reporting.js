"use strict";

angular

	// Define module
	.module(
		'monitool.services.statistics.reporting',
		[
			'monitool.services.statistics.olap'
		]
	)

	// TODO profiling this piece of code for perfs could not hurt.
	// we will see how bad if performs on the wild.
	.service('mtReporting', function($filter, $rootScope, uuid, CompoundCube, Cube, InputSlots, TimeSlot, itertools) {

		this.getColumns = function(groupBy, start, end, location, project) {
			var type;
			if (!location || location == 'none')
				type = 'project';
			else if (project.groups.find(function(g) { return 'grp_' + g.id === location }))
				type = 'group';
			else
				type = 'entity';

			if (['year', 'quarter', 'month', 'week_sat', 'week_sun', 'week_mon', 'day'].indexOf(groupBy) !== -1) {
				var slots = InputSlots.iterate(start, end, groupBy).map(function(slot) {
					return {id: slot, name: $filter('formatSlot')(slot), title: $filter('formatSlotRange')(slot)};
				});
				
				slots.push({id:'_total', name: "Total"});

				return slots;
			}
			else if (groupBy === 'entity') {
				if (type === 'project')
					return project.entities.concat([{id: '_total', name: 'Total'}]);
				else if (type === 'entity')
					return project.entities.filter(function(e) { return 'ent_' + e.id === location })
												.concat([{id: '_total', name: 'Total'}]);
				else  if (type === 'group') {
					var group = project.groups.find(function(g) { return 'grp_' + g.id === location });
					return project.entities.filter(function(e) { return group.members.indexOf(e.id) !== -1 })
												.concat([{id: '_total', name: 'Total'}]);
				}
			}
			else if (groupBy === 'group') {
				if (type === 'project')
					return project.groups;
				else if (type === 'entity')
					return project.groups.filter(function(g) { return g.members.indexOf(location.substring(4)) !== -1 });
				else if (type === 'group')
					return project.groups.filter(function(g) { return 'grp_' + g.id === location });
			}
			else
				throw new Error('Invalid groupBy: ' + groupBy)
		};

		this._makeActivityRow = function(cubes, indent, groupBy, viewFilters, columns, element) {
			// Retrieve cube & create filter.
			var cube = cubes[element.id],
				row = {id: uuid.v4(), name: element.name, type: 'data', indent: indent};

			// Handle invalid groupBy
			if (groupBy == 'entity' && !cube.dimensionsById.entity)
				row.message = 'project.not_available_by_entity';

			else if (groupBy == 'group' && !cube.dimensionsById.group)
				row.message = 'project.not_available_by_group';

			else if (!cube.dimensionsById[groupBy] && !cube.dimensionGroupsById[groupBy])
				row.message = 'project.not_available_min_' + cube.dimensions[0].id;

			else {
				try {
					var cubeFilters = this.createCubeFilter(cube, viewFilters);

					try {
						var values = cube.query([groupBy], cubeFilters, true);
						row.cols = columns.map(function(col) { return values[col.id]; });
					}
					catch (e) {
						row.message = 'project.no_data';
					}
				}
				catch (e) {
					row.message = 'project.not_available_by_entity';
				}
			}

			return row;
		};


		this._makeIndicatorRow = function(cubes, indent, groupBy, viewFilters, columns, indicator) {
			var row = {
				id: uuid.v4(),
				name: indicator.display, colorize: indicator.colorize,
				baseline: indicator.baseline, target: indicator.target,
				type: 'data',
				indent: indent
			};

			if (indicator.computation === null)
				row.message = 'project.indicator_computation_missing';

			else if (!isNaN(indicator.computation.formula))
				row.cols = columns.map(function(col) { return parseInt(indicator.computation.formula); });

			else {
				try {
					var cube = new CompoundCube(indicator.computation, cubes),
						cubeFilters = this.createCubeFilter(cube, viewFilters);

					try {
						var values = cube.query([groupBy], cubeFilters, true);
						row.cols = columns.map(function(col) { return values[col.id]; });
					}
					catch (e) {
						row.message = 'project.no_data';
					}
				}
				catch (e) {
					row.message = 'project.not_available';
				}
			}

			return row;
		};


		/**
		 * For more convenience, we allow views to pass unordotox filters to us.
		 * Those have the same format than regular filter ({dimension: [value1, value2]})
		 * but also allow some special keys that are prefixed with underscores:
		 *     _start: filters out everything before a given date
		 *     _end: filters out everything after a given date
		 *     _location: filters or everything outside of an entity or group (depending on the prefix).
		 */
		this.createCubeFilter = function(cube, viewFilters) {
			// Create a filter that explicitely allows everything!
			var cubeFilters = angular.copy(viewFilters);
			var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};
			var timeDimension = cube.dimensions[0]; // hack. We do this because we know the internals of Cube.
			
			for (var key in cubeFilters) {
				if (key.substring(0, 1) !== '_')
					continue;

				if (key === '_start') {
					if (!cubeFilters[timeDimension.id])
						cubeFilters[timeDimension.id] = timeDimension.items;

					var start = TimeSlot.fromDate(viewFilters._start, timeDimension.id).value;

					// This is O(n), but should not be. Can do O(logn)
					cubeFilters[timeDimension.id] = cubeFilters[timeDimension.id].filter(function(dimItem) { return start <= dimItem; });

					delete cubeFilters._start;
				}

				else if (key === '_end') {
					if (!cubeFilters[timeDimension.id])
						cubeFilters[timeDimension.id] = timeDimension.items;

					var end = TimeSlot.fromDate(viewFilters._end, timeDimension.id).value;

					// This is O(n), but should not be. Can do O(logn)
					cubeFilters[timeDimension.id] = cubeFilters[timeDimension.id].filter(function(dimItem) { return dimItem <= end; });

					delete cubeFilters._end;
				}

				else if (key === '_location') {
					// _location => filter either entity or group dimensions.
					// Don't check if they exist in the cube, because we want an exception to be raised in _makeXxxRow() later on if they don't.
					if (viewFilters._location.substring(0, 4) === 'ent_') {
						if (!cubeFilters.entity)
							cubeFilters.entity = cube.dimensionsById.entity.items;
						
						cubeFilters.entity = cubeFilters.entity.filter(function(dimItem) {
							return dimItem == viewFilters._location.substring(4);
						});
					}

					else if (viewFilters._location.substring(0, 4) === 'grp_') {
						if (!cubeFilters.group)
							cubeFilters.group = cube.dimensionGroupsById.group.items;

						cubeFilters.group = cubeFilters.group.filter(function(dimItem) {
							return dimItem == viewFilters._location.substring(4);
						});
					}

					else if (viewFilters._location !== 'none')
						throw new Error('Invalid _location');

					delete cubeFilters._location;
				}

				else
					// Other special keys are not allowed
					throw new Error('Invalid filter key');
			}

			return cubeFilters;
		};


		this.computeLogicalFrameReporting = function(cubes, project, logicalFrame, groupBy, viewFilters) {
			var columns = this.getColumns(groupBy, viewFilters._start, viewFilters._end, viewFilters._location, project),
				rows = [];

			if (logicalFrame.goal)
				rows.push({type: 'header', text: logicalFrame.goal, indent: 0});

			logicalFrame.indicators.forEach(function(indicatorPlanning, indicatorIndex) {
				var row = this._makeIndicatorRow(cubes, 0, groupBy, viewFilters, columns, indicatorPlanning);
				row.id = 'go_' + indicatorIndex;
				rows.push(row);
			}, this);

			logicalFrame.purposes.forEach(function(purpose, purposeIndex) {
				rows.push({type: 'header', text: purpose.description, indent: 1});
				
				purpose.indicators.forEach(function(indicatorPlanning, indicatorIndex) {
					var row = this._makeIndicatorRow(cubes, 1, groupBy, viewFilters, columns, indicatorPlanning);
					row.id = 'pp_' + purposeIndex + '.ind_' + indicatorIndex;
					rows.push(row);
				}, this);

				purpose.outputs.forEach(function(output, outputIndex) {
					rows.push({type: 'header', text: output.description, indent: 2});
					
					output.indicators.forEach(function(indicatorPlanning, indicatorIndex) {
						var row = this._makeIndicatorRow(cubes, 2, groupBy, viewFilters, columns, indicatorPlanning);
						row.id = 'pp_' + purposeIndex + 'out_' + outputIndex + '.ind_' + indicatorIndex;
						rows.push(row);
					}, this);
				}, this);
			}, this);

			return rows;
		};

		this.computeExtraReporting = function(cubes, project, groupBy, viewFilters) {
			var columns = this.getColumns(groupBy, viewFilters._start, viewFilters._end, viewFilters._location, project),
				rows = [];

			project.extraIndicators.forEach(function(indicatorPlanning, indicatorIndex) {
				var row = this._makeIndicatorRow(cubes, 0, groupBy, viewFilters, columns, indicatorPlanning);
				row.id = 'ext_' + indicatorIndex;
				rows.push(row);
			}, this);

			return rows;
		};

		this.computeCrossCuttingReporting = function(cubes, project, indicators, groupBy, viewFilters) {
			var columns = this.getColumns(groupBy, viewFilters._start, viewFilters._end, viewFilters._location, project),
				rows = [];

			indicators.forEach(function(indicator) {
				if (itertools.intersect(indicator.themes, project.themes).length === 0)
					return;

				var planning = {};
				if (project.crossCutting[indicator._id])
					angular.copy(project.crossCutting[indicator._id], planning);
				else
					planning.baseline = planning.target = planning.computation = null;

				planning.display = indicator.name[$rootScope.language];

				var row = this._makeIndicatorRow(cubes, 0, groupBy, viewFilters, columns, planning);
				row.id = 'cc_' + indicator._id;
				rows.push(row);
			}, this);

			rows.sort(function(a, b) { return a.name.localeCompare(b.name); });

			return rows;
		};

		// FIXME this should be recursive to make code neater, and not limit ourselves to 2 levels.
		this.computeDataSourceReporting = function(cubes, project, form, groupBy, viewFilters, splits) {
			var columns = this.getColumns(groupBy, viewFilters._start, viewFilters._end, viewFilters._location, project);

			// Create rows.
			var rows = [];
			form.elements.forEach(function(element) {
				var row = this._makeActivityRow(cubes, 0, groupBy, viewFilters, columns, element);
				row.id = element.id;
				row.partitions = element.partitions;
				row.isGroup = false;
				rows.push(row);
				
				if (splits[row.id] !== undefined) {
					var partition = element.partitions.find(function(p) { return p.id == splits[row.id]; });

					[partition.groups, partition.elements].forEach(function(elements) {
						elements.forEach(function(partitionElement) {
							var partitionId = partition.id + (partitionElement.members !== undefined ? '_g' : '');

							// add filter
							viewFilters[partitionId] = [partitionElement.id];

							var childRow = this._makeActivityRow(cubes, 1, groupBy, viewFilters, columns, element);
							childRow.id = row.id + '.' + partitionId + '/' + partitionElement.id;
							childRow.name = partitionElement.name;
							childRow.partitions = row.partitions.slice();
							childRow.isGroup = !!partitionElement.members;

							// remove the partition that is already chosen on upper level.
							childRow.partitions.splice(childRow.partitions.indexOf(partition), 1);

							rows.push(childRow)

							if (splits[childRow.id] !== undefined) {
								var childPartition = element.partitions.find(function(p) { return p.id == splits[childRow.id]; });

								[childPartition.groups, childPartition.elements].forEach(function(elements) {
									elements.forEach(function(subPartitionElement) {
										var childPartitionId = childPartition.id + (subPartitionElement.members !== undefined ? '_g' : '');

										// add filter
										viewFilters[childPartitionId] = [subPartitionElement.id];

										var subChildRow = this._makeActivityRow(cubes, 2, groupBy, viewFilters, columns, element);
										subChildRow.id = childRow.id + '.' + childPartitionId + '/' + subPartitionElement.id;
										subChildRow.name = subPartitionElement.name;
										subChildRow.isGroup = !!subPartitionElement.members;
										rows.push(subChildRow);

										// remove filter
										delete viewFilters[childPartitionId];
									}, this);
								}, this);
							}

							// remove filter
							delete viewFilters[partitionId];
						}, this);
					}, this);
				}
			}, this);

			return rows;
		};

		this.computeIndicatorReporting = function(cubes, project, indicator, groupBy, viewFilters) {
			var columns = this.getColumns(groupBy, viewFilters._start, viewFilters._end, viewFilters._location, project);
			var rows = []

			var row = this._makeIndicatorRow(cubes, 0, groupBy, viewFilters, columns, indicator)
			row.id = 'all_project'; // Override default id so that graphs don't disapear when filtering or changing variables.
			row.name = $filter('translate')('project.full_project');
			rows.push(row)

			rows.push({type: 'header', text: $filter('translate')('project.collection_site_list')})

			project.entities.forEach(function(entity) {
				viewFilters.entity = [entity.id];

				var row = this._makeIndicatorRow(cubes, 1, groupBy, viewFilters, columns, indicator);
				row.id = entity.id; // Override default id so that graphs don't disapear when filtering.
				row.name = entity.name;
				rows.push(row);

				delete viewFilters.entity;
			}, this);

			rows.push({type: 'header', text: $filter('translate')('project.groups')})

			project.groups.forEach(function(group) {
				viewFilters.group = [group.id];
				
				var row = this._makeIndicatorRow(cubes, 1, groupBy, viewFilters, columns, indicator);
				row.id = group.id; // Override default id so that graphs don't disapear when filtering.
				row.name = group.name;
				rows.push(row);

				delete viewFilters.group;
			}, this);

			return rows;
		};

		this.computeVariableReporting = function(cubes, project, element, groupBy, viewFilters) {
			var columns = this.getColumns(groupBy, viewFilters._start, viewFilters._end, viewFilters._location, project);
			var rows = []

			var row = this._makeActivityRow(cubes, 0, groupBy, viewFilters, columns, element);
			row.id = 'all_project'; // Override default id so that graphs don't disapear when filtering or changing variables.
			row.name = $filter('translate')('project.full_project'); // Replace default name (element name) by "Full project".

			rows.push(row)
			rows.push({type: 'header', text: $filter('translate')('project.collection_site_list')})

			project.entities.forEach(function(entity) {
				viewFilters.entity = [entity.id];
				
				var row = this._makeActivityRow(cubes, 1, groupBy, viewFilters, columns, element);
				row.id = entity.id; // Override default id so that graphs don't disapear when filtering.
				row.name = entity.name; // Replace default name by collection site name.
				rows.push(row);

				delete viewFilters.entity;
			}, this);

			rows.push({type: 'header', text: $filter('translate')('project.groups')})

			project.groups.forEach(function(group) {
				viewFilters.group = [group.id];
				
				var row = this._makeActivityRow(cubes, 1, groupBy, viewFilters, columns, element);
				row.id = group.id; // Override default id so that graphs don't disapear when filtering.
				row.name = group.name; // Replace default name by group name.
				rows.push(row);

				delete viewFilters.group;
			}, this);

			return rows;
		};
		
	});

