"use strict";

var reportingServices = angular.module('monitool.services.reporting', []);

reportingServices.factory('mtForms', function() {

	var annotateFormElement = function(formElement, currentKeyPath, currentIndicatorPath, indicatorsById) {
		var indicator = indicatorsById[formElement.id];
		formElement.name = indicator.name;
		formElement.keyPath = currentKeyPath;
		formElement.indicatorPath = currentIndicatorPath;
		formElement.model = formElement.type.substring(0, 5) === 'link:' ? formElement.type.substring(5) : formElement.keyPath;
		formElement.timeAggregation = indicator.timeAggregation;
		formElement.geoAggregation = indicator.geoAggregation;

		// input is always allowed
		formElement.availableTypes = [
			{
				value: 'input',
				label: 'project.manual_input',
				group: null
			}
		]; 

		formulaLoop:for (var formulaId in indicator.formulas) {
			var formula = indicator.formulas[formulaId];

			// Skip a formula if one of it's parameters is a parent.
			// Note: I'am not sure this is always relevant.
			var parentIndicators = formElement.indicatorPath.split('.');
			for (var key in formula.parameters)
				if (parentIndicators.indexOf(formula.parameters[key]) !== -1)
					continue formulaLoop;

			// Add each formula to the element
			formElement.availableTypes.push({
				value: 'compute:' + formulaId,
				label: "project.formula",
				name: formula.name,
				group: "indicator.formulas"
			});

			// if the element is computed using the current formula
			// => recurse and annotate children
			if (formElement.type === 'compute:' + formulaId) {
				formElement.expression = formula.expression;
				for (var key in formula.parameters) {
					formElement.parameters[key].id = formula.parameters[key];
					annotateFormElement(
						formElement.parameters[key],
						currentKeyPath + '.' + key,
						currentIndicatorPath + '.' + formula.parameters[key],
						indicatorsById
					);
				}
			}
		}
	};

	var annotateAllFormElements = function(formElements, indicatorsById) {
		formElements.forEach(function(formElement) {
			annotateFormElement(formElement, formElement.id, formElement.id, indicatorsById);
		});
	};

	// Makes an array with all formElements by traversing the tree.
	var flatten = function(formElements) {
		var flattenRec = function(formElement) {
			var result = [formElement];
			for (var key in formElement.parameters)
				result = result.concat(flattenRec(formElement.parameters[key]))
			return result;
		};

		var flatFormElements = [];
		formElements.forEach(function(formElement) {
			flatFormElements = flatFormElements.concat(flattenRec(formElement));
		});
		return flatFormElements;
	};


	// FIXME: creating infinite loops is possible when using 2 indicators that links to each other compute parameters.
	var buildLinks = function(formElements, indicatorsById) {
		// flatten all form elements in an array to iterate it with native methods
		var flatFormElements = flatten(formElements);

		// we need to add all valid links now.
		flatFormElements.forEach(function(changingFormElement) {
			// Remove previously build links.
			changingFormElement.availableTypes = changingFormElement.availableTypes.filter(function(type) {
				return type.value.substring(0, "link".length) !== 'link';
			});

			// Search for all possible links, in O(n), because we're lazy.
			flatFormElements.forEach(function(linkFormElement) {
				if (changingFormElement.id === linkFormElement.id
					&& linkFormElement.keyPath !== changingFormElement.keyPath.substring(0, linkFormElement.keyPath.length) // can't link to a parent or yourself.
					// && changingFormElement.keyPath !== linkFormElement.keyPath  // can't link to youself
					&& linkFormElement.type.substring(0, "link".length) !== 'link') {

					var name = indicatorsById[linkFormElement.keyPath.split('.')[0]].name;
					if (linkFormElement.keyPath.indexOf('.') !== -1)
						name += ' > ' + linkFormElement.keyPath.split('.').slice(1).join(' > ');

					changingFormElement.availableTypes.push({
						value: 'link:' + linkFormElement.keyPath,
						label: 'project.link',
						name: name,
						group: 'project.links'
					});
				}
			});
		});
	};

	var buildSumability = function(formElements) {
		var formElementsByKeyPath = {};
		flatten(formElements).forEach(function(formElement) {
			formElementsByKeyPath[formElement.keyPath] = formElement;
		});

		var buildSumabilityRec = function(formElement) {
			var type = formElement.type.split(':');

			if (type[0] === "compute") {
				var time = true, geo = true;
				for (var key in formElement.parameters) {
					buildSumabilityRec(formElement.parameters[key]);
					if (!formElement.parameters[key].timeAggregation)
						time = false;
					if (!formElement.parameters[key].geoAggregation)
						geo = false;
				}
				formElement.timeAggregationRec = time;
				formElement.geoAggregationRec = geo;
			}
			else if (type[0] === "link") {
				formElement.timeAggregationRec = formElementsByKeyPath[type[1]].timeAggregation;
				formElement.geoAggregationRec = formElementsByKeyPath[type[1]].geoAggregation;
			}
			else { // == input
				formElement.timeAggregationRec = formElement.timeAggregation;
				formElement.geoAggregationRec = formElement.geoAggregation;
			}
		};

		formElements.forEach(function(formElement) {
			buildSumabilityRec(formElement);
		});
	};

	// Removing an indicator from the tree means we need to
	// - delete the entry in the tree.
	// - change all broken links to that subtree to inputs.
	var deleteFormElement = function(formElements, formElement) {
		// Delete element from tree.
		var path = formElement.keyPath.split('.');
		if (path.length === 1)
			formElements.splice(formElements.indexOf(formElement), 1);
		else {
			// Start from root and look for the parent of formElement.
			var parent = formElements.find(function(fe) { return fe.id == path[0]; });
			for (var i = 1; i < path.length - 1; ++i)
				parent = parent.parameters[path[i]];
			delete parent.parameters[path[path.length - 1]];
		}

		// Replace all broken links by inputs.
		// That's not ideal but choosing a way to fix the tree that makes sense when there are deeplinks is far from easy.
		// On the GUI this behaviour seems more natural than reparenting/cloning subtrees.
		var brokenLinkPrefix = 'link:' + formElement.keyPath;
		flatten(formElements).forEach(function(brokenFormElement) {
			if (brokenFormElement.type.substring(0, brokenLinkPrefix.length) === brokenLinkPrefix)
				brokenFormElement.type = 'input';
		});
	};

	var deAnnotateFormElements = function(formElement, deleteId) {
		for (var key in formElement.parameters)
			deAnnotateFormElements(formElement.parameters[key], true);

		if (deleteId)
			delete formElement.id;
		
		if (formElement.type !== 'input')
			delete formElement.source;

		delete formElement.name;
		delete formElement.expression;
		delete formElement.availableTypes;
		delete formElement.keyPath;
		delete formElement.indicatorPath;
		delete formElement.model;
		delete formElement.timeAggregation;
		delete formElement.geoAggregation;
		delete formElement.timeAggregationRec;
		delete formElement.geoAggregationRec;
	};

	var deAnnotateAllFormElements = function(formElements) {
		formElements.forEach(function(formElement) {
			deAnnotateFormElements(formElement, false);
		});
	};

	var evaluate = function(formElement, formElements, scope) {
		var parts = formElement.type.split(':'),
			type  = parts[0],
			id    = parts.length > 1 ? parts[1] : null;

		if (type === 'compute') {
			var localScope = {};
			for (var key in formElement.parameters) {
				evaluate(formElement.parameters[key], formElements, scope);
				localScope[key] = scope[formElement.parameters[key].model];
			}

			try {
				scope[formElement.model] = Parser.evaluate(formElement.expression, localScope);
			}
			catch (e) {
				scope[formElement.model] = undefined;
			}
		}
		else if (type === 'link') {
			var path = id.split('.');
			var linkedElement = formElements.find(function(fe) { return fe.id == path[0]; });
			for (var i = 1; i < path.length; ++i)
				linkedElement = linkedElement.parameters[path[i]];

			evaluate(linkedElement, formElements, scope);
		}
	};

	var evaluateAll = function(formElements, scope) {
		formElements.forEach(function(formElement) {
			evaluate(formElement, formElements, scope);
		});
	};

	return {
		evaluate: evaluate,
		evaluateAll: evaluateAll,
		annotateFormElement: annotateFormElement,
		annotateAllFormElements: annotateAllFormElements,
		flatten: flatten,
		buildLinks: buildLinks,
		deleteFormElement: deleteFormElement,
		deAnnotateFormElements: deAnnotateFormElements,
		deAnnotateAllFormElements: deAnnotateAllFormElements,
		buildSumability: buildSumability
	};
});


reportingServices.factory('mtFormula', function($q) {
	return {
		/**
		 * In: {expression: "a + b", parameters: {a: 42}}
		 * Out {expression: "a + b", parameters: {a: 42}, symbols: ['a', 'b'], isValid: false}
		 */
		annotate: function(formula) {
			formula.__isValid = true;
			try {
				var ast = Parser.parse(formula.expression);
				formula.__symbols = ast.variables();
			}
			catch (e) { 
				formula.__symbols = [];
				formula.__isValid = false;
			}

			var numSymbols = formula.__symbols.length;
			for (var i = 0; i < numSymbols; ++i)
				if (!formula.parameters[formula.__symbols[i]])
					formula.__isValid = false;

			if (!formula.name)
				formula.__isValid = false;
		},

		/**
		 * Clean up
		 */
		clean: function(formula) {
			for (var key in formula.parameters)
				if (formula.__symbols.indexOf(key) === -1)
					delete formula.parameters[key];
		},
		
	}
});


reportingServices.factory('mtReporting', function($q, mtForms, mtFetch) {

	var sumBy = function(inputs, groupBy) {
		var result = {};

		inputs.forEach(function(input) {
			input[groupBy].forEach(function(key) {
				if (!result[key])
					result[key] = angular.copy(input.values);
				else
					for (var indicatorId in input.values) {
						if (result[key][indicatorId])
							result[key][indicatorId] += input.values[indicatorId];
						else
							result[key][indicatorId] = input.values[indicatorId];
					}
			});
		});

		return result;
	};

	var getStatsColumns = function(query) {
		if (['year', 'month', 'week', 'day'].indexOf(query.groupBy) !== -1) {
			var begin      = moment(query.begin, 'YYYY-MM-DD').startOf(query.groupBy === 'week' ? 'isoWeek' : query.groupBy),
				end        = moment(query.end, 'YYYY-MM-DD').endOf(query.groupBy === 'week' ? 'isoWeek' : query.groupBy),
				dispFormat = {'year': 'YYYY', 'month': 'YYYY-MM', 'week': 'YYYY-MM-DD', 'day': 'YYYY-MM-DD'}[query.groupBy],
				idFormat   = {'year': 'YYYY', 'month': 'YYYY-MM', 'week': 'YYYY-[W]WW', 'day': 'YYYY-MM-DD'}[query.groupBy],
				current    = begin.clone(),
				cols       = [];

			while (current.isBefore(end) || current.isSame(end)) {
				cols.push({id: current.format(idFormat), name: current.format(dispFormat)});
				current.add(1, query.groupBy);
			}

			cols.push({id: 'total', name: 'Total'});

			return cols;
		}
		else if (query.groupBy === 'entity') {
			if (query.type === 'project')
				return query.project.inputEntities.concat([{id:'total',name:'Total'}]);
			else if (query.type === 'entity')
				return query.project.inputEntities.filter(function(e) { return e.id === query.id })
											.concat([{id:'total',name:'Total'}]);
			else  if (query.type === 'group') {
				var group = query.project.inputGroups.find(function(g) { return g.id === query.id });
				return query.project.inputEntities.filter(function(e) { return group.members.indexOf(e.id) !== -1 })
											.concat([{id:'total',name:'Total'}]);
			}
		}
		else if (query.groupBy === 'group') {
			if (query.type === 'project')
				return query.project.inputGroups;
			else if (query.type === 'entity')
				return query.project.inputGroups.filter(function(g) { return g.members.indexOf(query.id) !== -1 });
			else if (query.type === 'group')
				return query.project.inputGroups.filter(function(g) { return g.id === query.id });
		}
		else
			throw new Error('Invalid groupBy: ' + query.groupBy)
	};


	/**
	 * Retrieve from server all inputs that match (between 2 dates)
	 * - a given project
	 * - a given indicator
	 * - a group or an entity
	 */
	var getInputs = function(query) {
		// Retrieve all relevant inputs.
		var options;
		if (query.type === 'project' || query.type === 'group')
			options = {mode: 'project_inputs', begin: query.begin, end: query.end, projectId: query.project._id};

		else if (query.type === 'entity')
			options = {mode: 'entity_inputs', begin: query.begin, end: query.end, entityId: query.id};

		else if (query.type === 'indicator')
			// we want all inputs from a form with the relevant formId
			options = {
				mode: 'form_inputs',
				begin: query.begin, end: query.end,
				formId: query.projects.map(function(p) {
					var form = p.dataCollection.find(function(f) {
						return !!f.fields.find(function(field) { return query.indicator._id === field.id });
					});
					return form ? form.id : null;
				}).filter(function(form) { return form; })
			};
		else
			throw new Error('query.type must be indicator, project, group or entity');

		return mtFetch.inputs(options).then(function(inputs) {
			// This first step should be useless if the API works properly
			if (query.type === 'project')
				inputs = inputs.filter(function(input) { return input.project === query.project._id; });
			else if (query.type === 'entity')
				inputs = inputs.filter(function(input) { return input.entity === query.id; });

			// annotate each input with keys that will later tell the sumBy function how to aggregate the data.
			inputs.forEach(function(input) {
				var period = moment(input.period);
				var project = query.project || query.projects.find(function(p) { return p._id === input.project; });

				input.yearAgg   = ['total', period.format('YYYY')];
				input.monthAgg  = ['total', period.format('YYYY-MM')];
				input.weekAgg   = ['total', period.format('YYYY-[W]WW')];
				input.dayAgg    = ['total', period.format('YYYY-MM-DD')];

				// some inputs are linked to the projet => they don't have any entity field.
				if (input.entity !== 'none') {
					input.entityAgg = ['total', input.entity];

					// no total here, groups may have a non-empty intersection.
					input.groupAgg  = project.inputGroups.filter(function(group) {
						return group.members.indexOf(input.entity) !== -1;
					}).map(function(group) {
						return group.id;
					});
				}
				else {
					input.entityAgg = ['total'];
					input.groupAgg = [];
				}
			});

			// discard all inputs that are not relevant...
			if (query.type === 'group')
				inputs = inputs.filter(function(input) { return input.groupAgg.indexOf(query.id) !== -1 });

			return inputs;
		});
	};

	/**
	 * This function regroup inputs into a usable 2 level hash. ex: {2014-01: {indicatorId: 455}}
	 * it could be optimized a bit: an extra copy is done at the end, and when we have nested compute: values, the subtree is evaluated as many times.
	 */
	var regroup = function(inputs, query, indicatorsById) {
		var aggregationKey  = ['year', 'month', 'week', 'day'].indexOf(query.groupBy) !== -1 ? 'timeAggregation' : 'geoAggregation',
			globalRegrouped = {};

		// we want to compute all data
		query.project.dataCollection.forEach(function(form) {
			// to make our work easier later, we create a hash table (indicatorPath => formElement)
			var formElementsByModel = {};
			mtForms.flatten(form.fields).forEach(function(formElement) {
				if (formElement.type.substring(0, 5) !== 'link:')
					formElementsByModel[formElement.model] = formElement;
			});

			// Retrieve all forms that were made by current form and group them as asked.
			var formInputs         = inputs.filter(function(input) { return input.form === form.id; }),
				formRawRegrouped   = sumBy(formInputs, query.groupBy + 'Agg'),
				formFinalRegrouped = {};

			console.log('formRawRegrouped', form.id, JSON.stringify(formRawRegrouped, null, "\t"));

			// "for each month" "for each year" "for each inputEntity", etc...
			for (var groupkey in formRawRegrouped) {
				// First pass: compute everythink we can, only with averages and sums, and delete values that are wrong.
				for (var indicatorModel in formRawRegrouped[groupkey]) {
					if (indicatorModel === 'count')
						continue;

					var formElement = formElementsByModel[indicatorModel];

					// if no aggregation was done (count === 1), then "none" values are not to be deleted!
					if (formRawRegrouped[groupkey].count !== 1) {
						if (formElement[aggregationKey] === 'none')
							delete formRawRegrouped[groupkey][indicatorModel];

						// looping the input fields instead of formElements ensures that we won't divide twice the same element.
						else if (formElement[aggregationKey] === 'average')
							formRawRegrouped[groupkey][indicatorModel] /= formRawRegrouped[groupkey].count;
					}
				}

				// Now that all values are either gone or right in the scope, compute missing values.
				// This may not succeed, but that's OK: the user was warned when the form was created.
				formFinalRegrouped[groupkey] = {};
				form.fields.forEach(function(formElement) {
					// if the value was computed by simple sum or average, take it.
					if (formRawRegrouped[groupkey][formElement.model] !== undefined)
						formFinalRegrouped[groupkey][formElement.id] = formRawRegrouped[groupkey][formElement.model];

					// otherwise, try to compute it.
					else {
						mtForms.evaluate(formElement, form.fields, formRawRegrouped[groupkey]);

						// try again to take it
						if (formRawRegrouped[groupkey][formElement.model] !== undefined)
							formFinalRegrouped[groupkey][formElement.id] = formRawRegrouped[groupkey][formElement.model];
					}
				});
			}

			console.log('formRawRegrouped', form.id, JSON.stringify(formRawRegrouped, null, "\t"));
			console.log('formFinalRegrouped', form.id, JSON.stringify(formFinalRegrouped, null, "\t"));

			// copy values in the final hash and replace conflicted values by a marker
			// the only way to have conflicted values is to aggregate over a time range where 2 different forms where used.
			for (var groupkey in formFinalRegrouped) {
				if (!globalRegrouped[groupkey])
					globalRegrouped[groupkey] = {};

				for (var indicatorId in formFinalRegrouped[groupkey]) {
					if (globalRegrouped[groupkey][indicatorId] !== undefined)
						globalRegrouped[groupkey][indicatorId] = 'CONFLICT';
					else
						globalRegrouped[groupkey][indicatorId] = formFinalRegrouped[groupkey][indicatorId]
				}
			}

		});

		var cols = getStatsColumns(query);

		console.log('globalRegrouped', JSON.stringify(globalRegrouped, null, "\t"))
		// console.log(cols.map(function(col) {
		// 	return globalRegrouped[col.id] && globalRegrouped[col.id][indicatorId] !== undefined ? globalRegrouped[col.id][indicatorId] : null;
		// }))
		// console.log()

		return {
			cols: cols,
			rows: Object.keys(query.project.indicators).map(function(indicatorId) {
				console.log('INDICATORID', indicatorId)
				return {
					id: indicatorId,
					name: indicatorsById[indicatorId].name,
					unit: indicatorsById[indicatorId].unit,
					baseline: query.project.indicators[indicatorId].baseline,
					target: query.project.indicators[indicatorId].target,
					showRed: query.project.indicators[indicatorId].showRed,
					showYellow: query.project.indicators[indicatorId].showYellow,
					cols: cols.map(function(col) {
						return globalRegrouped[col.id] && globalRegrouped[col.id][indicatorId] !== undefined ? globalRegrouped[col.id][indicatorId] : null;
					})
				};
			})
		};
	};

	var regroupIndicator = function(inputs, query, indicatorById) {
		var rows = [];

		query.projects.forEach(function(project) {
			var projectInputs     = inputs.filter(function(input) { return input.project === project._id; }),
				projectQuery      = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy},
				projectResult     = regroup(projectInputs, projectQuery, indicatorById);

			// override id and name
			var row = projectResult.rows.find(function(row) { return row.id === query.indicator._id; });
			row.id = project._id;
			row.name = project.name;
			row.type = 'project'; // presentation hack, should not be here.
			rows.push(row);

			project.inputEntities.forEach(function(entity) {
				var entityInputs = projectInputs.filter(function(input) { return input.entity === entity.id; }),
					entityQuery  = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy, type: 'entity', id: entity.id},
					entityResult = regroup(entityInputs, entityQuery, indicatorById);

				// override id and name
				var row = entityResult.rows.find(function(row) { return row.id === query.indicator._id; });
				row.id = entity.id;
				row.name = entity.name;
				row.type = 'entity'; // presentation hack, should not be here.
				rows.push(row);
			});
		});

		return { cols: getStatsColumns(query), rows: rows };
	};

	var getDefaultStartDate = function(project) {
		var result = moment().subtract(1, 'year');
		if (project && result.isBefore(project.begin))
			result = moment(project.begin)
		return result.format('YYYY-MM-DD');
	};

	var getDefaultEndDate = function(project) {
		return moment().format('YYYY-MM-DD');
	};

	var getAnnotatedProjectCopy = function(project, indicatorsById) {
		project = angular.copy(project);
		project.dataCollection.forEach(function(form) {
			mtForms.annotateAllFormElements(form.fields, indicatorsById);
		});
		return project;
	};

	return {
		getStatsColumns: getStatsColumns,
		getDefaultStartDate: getDefaultStartDate,
		getDefaultEndDate: getDefaultEndDate,
		getInputs : getInputs,
		getAnnotatedProjectCopy: getAnnotatedProjectCopy,
		regroup: regroup,
		regroupIndicator: regroupIndicator,
	};
});

