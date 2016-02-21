"use strict";

angular

	// Define module
	.module(
		'monitool.services.reporting',
		[]
	)

	// TODO profiling this piece of code for perfs could not hurt.
	// we will see how bad if performs on the wild.
	.service('mtReporting', function($filter) {

		this.getColumns = function(groupBy, begin, end, entityId, project) {
			var type;
			if (!entityId)
				type = 'project';
			else if (project.groups.find(function(g) { return g.id === entityId }))
				type = 'group';
			else
				type = 'entity';

			if (['year', 'quarter', 'month', 'week', 'day'].indexOf(groupBy) !== -1) {
				var begin      = moment(begin).startOf(groupBy === 'week' ? 'isoWeek' : groupBy),
					end        = moment(end).endOf(groupBy === 'week' ? 'isoWeek' : groupBy),
					dispFormat = {'year': 'YYYY', 'quarter': 'YYYY-[Q]Q', 'month': 'YYYY-MM', 'week': 'YYYY-MM-DD', 'day': 'YYYY-MM-DD'}[groupBy],
					idFormat   = {'year': 'YYYY', 'quarter': 'YYYY-[Q]Q', 'month': 'YYYY-MM', 'week': 'YYYY-[W]WW', 'day': 'YYYY-MM-DD'}[groupBy],
					current    = begin.clone(),
					cols       = [];

				while (current.isBefore(end) || current.isSame(end)) {
					cols.push({id: current.format(idFormat), name: current.format(dispFormat)});
					current.add(1, groupBy);
				}

				cols.push({id: 'total', name: 'Total'});

				return cols;
			}
			else if (groupBy === 'entity') {
				if (type === 'project')
					return project.entities.concat([{id:'total',name:'Total'}]);
				else if (type === 'entity')
					return project.entities.filter(function(e) { return e.id === entityId })
												.concat([{id:'total',name:'Total'}]);
				else  if (type === 'group') {
					var group = project.groups.find(function(g) { return g.id === entityId });
					return project.entities.filter(function(e) { return group.members.indexOf(e.id) !== -1 })
												.concat([{id:'total',name:'Total'}]);
				}
			}
			else if (groupBy === 'group') {
				if (type === 'project')
					return project.groups;
				else if (type === 'entity')
					return project.groups.filter(function(g) { return g.members.indexOf(entityId) !== -1 });
				else if (type === 'group')
					return project.groups.filter(function(g) { return g.id === entityId });
			}
			else
				throw new Error('Invalid groupBy: ' + groupBy)
		};


		this._queryCube = function(groups, cube, dimensionIds, filterValues) {
			dimensionIds = dimensionIds.slice();
			filterValues = JSON.parse(JSON.stringify(filterValues));
			
			var result;

			// Replace group filters by entities filters.
			if (filterValues.group && filterValues.group.length === 1) {
				// Check that we are not overriding something.
				if (filterValues.entity)
					throw new Error('unsupported');

				filterValues.entity = groups.find(function(g) { return g.id == filterValues.group[0]; }).members;
				delete filterValues.group;
			}
			else if (filterValues.group)
				throw new Error('unsupported');

			// If user want to group by group, we need to cheat: use filters and merge result.
			var groupIndex = dimensionIds.indexOf('group');

			// console.log(dimensionIds, filterValues);

			// The cheat only works when group is first in the list.
			if (groupIndex == 0) {
				// Check that we are not overriding something.
				if (filterValues.entity)
					throw new Error('unsupported');
				
				dimensionIds.shift(); // remove first element.

				result = {total: cube.query(dimensionIds, filterValues)};
				groups.forEach(function(group) {
					filterValues.entity = group.members;
					result[group.id] = cube.query(dimensionIds, filterValues);
				});
			}
			else if (groupIndex > 0) {
				throw new Error('unsupported groupIndex > 1');
			}
			else if (dimensionIds.length == 1) {
				result = cube.query(dimensionIds, filterValues);
				var total = cube.query([], filterValues);
				if (total !== undefined)
					result.total = total;
			}
			else {
				throw new Error('unsupported');
			}

			return result;
		};

		this._computeIndicator = function(groups, cubes, indicator, groupBy, filters) {
			// Ask the olap cube to compute the components we need to compute the indicator.
			// Like this: {'numerator': {'2010-01': 4, ...}, ...}
			var components = {};
			for (var key in indicator.parameters) {
				var parameter = indicator.parameters[key];

				// We should intersect filters of same dimension, but we know in advance that 
				// having 2 filters of the same dim never happens.
				var k, filter = {};
				for (k in filters) filter[k] = filters[k];
				for (k in parameter.filter) filter[k] = parameter.filter[k];

				components[key] = this._queryCube(groups, cubes[parameter.elementId], [groupBy], filter);
			}

			// Inverse group and component key, to get scopes
			// Like this: {'2010-01': {'numerator': 4, ...}, ...}
			var localScopes = {};
			for (var key in components) {
				for (var group in components[key]) {
					if (localScopes[group] == undefined)
						localScopes[group] = {};

					localScopes[group][key] = components[key][group];
				}
			}

			// Compute indicator
			var result = {};
			for (var group in localScopes) {
				try { result[group] = Parser.evaluate(indicator.formula, localScopes[group]); }
				catch (e) { result[group] = 'INVALID_FORMULA'; }
			}

			return result;
		};

		this._makeActivityRow = function(groups, cubes, indent, groupBy, filters, columns, element) {
			var values = this._queryCube(groups, cubes[element.id], [groupBy], filters);

			return {
				id: makeUUID(),
				name: element.name,
				cols: columns.map(function(col) { return values[col.id]; }),
				type: 'data',
				indent: indent
			};
		};

		this._makeIndicatorRow = function(groups, cubes, indent, groupBy, filters, columns, indicator) {
			var indicatorValues = this._computeIndicator(groups, cubes, indicator, groupBy, filters),
				baseline = indicator.baseline,
				target = indicator.target;

			if (typeof baseline == 'number' && indicator.unit != 'none')
				baseline += indicator.unit;

			if (typeof target == 'number' && indicator.unit != 'none')
				target += indicator.unit;

			return {
				id: makeUUID(),
				name: indicator.display, unit: indicator.unit, colorize: indicator.colorize,
				baseline: baseline, target: target, targetType: indicator.targetType,
				cols: columns.map(function(col) { return indicatorValues[col.id]; }),
				type: 'data',
				indent: indent
			};
		};

		this.computeActivityReporting = function(cubes, project, groupBy, filters, splits) {
			var columns = this.getColumns(groupBy, filters.begin, filters.end, filters.entityId, project);

			// Computing too much. We could: qFilters[groupBy] = columns.pluck('id');
			var qFilters = {};
			if (filters.entityId && project.entities.pluck('id').indexOf(filters.entityId) != -1)
				qFilters.entity = [filters.entityId];
			else if (filters.entityId)
				qFilters.group = [filters.entityId];

			// Create rows.
			var rows = [];
			project.forms.forEach(function(form) {
				rows.push({type: 'header', text: form.name});
				form.elements.forEach(function(element) {
					var row = this._makeActivityRow(project.groups, cubes, 1, groupBy, qFilters, columns, element);
					row.id = element.id;
					row.partitions = element.partitions.map(function(p, index) {
						return {
							index: index,
							name: p.map(function(p) { return p.name.substring(0, 1).toLocaleUpperCase(); }).join('/'),
							fullname: p.pluck('name').join(' / ')
						}
					});
					rows.push(row);

					if (splits[row.id] !== undefined) {
						var partitionIndex = splits[row.id];
						element.partitions[partitionIndex].forEach(function(part) {
							// add filter
							qFilters['partition' + partitionIndex] = [part.id];

							var childRow = this._makeActivityRow(project.groups, cubes, 2, groupBy, qFilters, columns, element);
							childRow.id = element.id + '.' + partitionIndex + '/' + part.id;
							childRow.name = part.name;
							childRow.partitions = row.partitions.slice();
							childRow.partitions.splice(partitionIndex, 1); // remove the already chosen partition
							rows.push(childRow)

							if (splits[childRow.id] !== undefined) {
								var childPartitionIndex = splits[childRow.id];

								element.partitions[childPartitionIndex].forEach(function(subPart) {
									// add filter
									qFilters['partition' + childPartitionIndex] = [subPart.id];

									var subChildRow = this._makeActivityRow(project.groups, cubes, 3, groupBy, qFilters, columns, element);
									subChildRow.id = element.id + '.' + partitionIndex + '/' + part.id + '.' + childPartitionIndex + '/' + subPart.id;
									subChildRow.name = subPart.name;
									rows.push(subChildRow);

									// remove filter
									delete qFilters['partition' + childPartitionIndex];
								}, this);
							}

							// remove filter
							delete qFilters['partition' + partitionIndex];
						}, this);
					}
				}, this);
			}, this);

			return rows;
		};

		this.computeReporting = function(cubes, project, logicalFrame, groupBy, filters) {
			var columns = this.getColumns(groupBy, filters.begin, filters.end, filters.entityId, project),
				rows = [];

			// Computing too much. We could: qFilters[groupBy] = columns.pluck('id');
			var qFilters = {};
			if (filters.entityId && project.entities.pluck('id').indexOf(filters.entityId) != -1)
				qFilters.entity = [filters.entityId];
			else if (filters.entityId)
				qFilters.group = [filters.entityId];

			rows.push({type: 'header', text: logicalFrame.goal, indent: 0});
			Array.prototype.push.apply(rows, logicalFrame.indicators.map(this._makeIndicatorRow.bind(this, project.groups, cubes, 0, groupBy, qFilters, columns)));
			logicalFrame.purposes.forEach(function(purpose) {
				rows.push({type: 'header', text: purpose.description, indent: 1});
				Array.prototype.push.apply(rows, purpose.indicators.map(this._makeIndicatorRow.bind(this, project.groups, cubes, 1, groupBy, qFilters, columns)));
				purpose.outputs.forEach(function(output) {
					rows.push({type: 'header', text: purpose.description, indent: 2});
					Array.prototype.push.apply(rows, purpose.indicators.map(this._makeIndicatorRow.bind(this, project.groups, cubes, 2, groupBy, qFilters, columns)));
				}, this);
			}, this);

			return rows;
		};

		this.computeDetailedReporting = function(cubes, project, indicator, groupBy, filters) {
			var columns = this.getColumns(groupBy, filters.begin, filters.end, filters.entityId, project);
			var rows = []

			var row = this._makeIndicatorRow(project.groups, cubes, 0, groupBy, {}, columns, indicator)
			row.name = $filter('translate')('project.full_project');

			rows.push(row)
			rows.push({type: 'header', text: $filter('translate')('project.collection_site_list')})

			project.entities.forEach(function(entity) {
				var row = this._makeIndicatorRow(project.groups, cubes, 1, groupBy, {entity: [entity.id]}, columns, indicator);
				row.name = entity.name;
				rows.push(row);
			}, this);

			rows.push({type: 'header', text: $filter('translate')('project.groups')})

			project.groups.forEach(function(group) {
				var row = this._makeIndicatorRow(project.groups, cubes, 1, groupBy, {group: [group.id]}, columns, indicator);
				row.name = group.name;
				rows.push(row);
			}, this);

			return rows;
		};
	});


