
// This not-very-well-written directive displays an accordeon with themes and types and indicators.
// The user can choose what to display for the indicator display

angular
	.module('monitool.directives.indicatorselect', [])
	.directive('indicatorSelect', function($q, mtFetch, mtDatabase) {
		return {
			templateUrl: 'partials/indicators/accordeon.html',
			restrict: "E",
			scope: {
				choose: '=choose',
				userCtx: '=userCtx',
				standard: '=standard',
				orderField: '=orderField',
				forbidden: '=forbidden'
			},
			link: function(scope, element, attributes, controller, transclude) {
				var themesById = {},
					typesById  = {},
					viewName   = null;

				scope.toggleTheme = function(theme) {
					theme.open = !theme.open;

					if (!theme.loaded) {
						theme.loaded = true; // before callback...

						var opts = {group_level: 2, startkey: [theme.id], endkey: [theme.id, {}]};
						mtDatabase.current.query(viewName, opts).then(function(result) {
							theme.types = result.rows.map(function(row) {
								var type = typesById[row.key[1]] || {};
								return {id: row.key[1], name: type.name, numIndicators: row.value, open: false, loaded: false, indicators: []};
							});
						});
					}
				};

				scope.toggleType = function(theme, type) {
					type.open = !type.open;

					if (!type.loaded) {
						type.loaded = true; // before callback...

						var opts = {reduce: false, startkey: [theme.id, type.id], endkey: [theme.id, type.id, {}]};
						mtDatabase.current.query(viewName, opts).then(function(result) {
							type.indicators = result.rows.map(function(row) { return {id: row.id, name: row.value.name, standard: row.value.standard}; });

							var opts = {group: true, keys: []}
							result.rows.map(function(row) { opts.keys.push('input:' + row.id, 'main:' + row.id); });
							mtDatabase.current.query('shortlists/indicator_usage', opts).then(function(result) {
								// slow!!!
								type.indicators.forEach(function(indicator) {
									result.rows.forEach(function(row) {
										if (row.key == 'main:' + indicator.id)
											indicator.main = row.value;
										if (row.key == 'input:' + indicator.id)
											indicator.input = row.value;
									});
									indicator.main = indicator.main || 0;
									indicator.input = indicator.input || 0;
								});
							});
						});
					}
				};

				// Load all themes and types.
				$q.all([mtFetch.themesById(), mtFetch.typesById()]).then(function(result) {
					scope.themes = themesById = result[0];
					scope.types = typesById = result[1];

					scope.buttons = {};
					attributes.buttons.split(',').forEach(function(button) {
						scope.buttons[button] = true;
					});
					
					scope.$watch('standard', function(newValue, oldValue) {
						scope.hierarchy = [];
						viewName = newValue ? 'shortlists/indicator_partial_tree' : 'shortlists/indicator_full_tree';
						mtDatabase.current.query(viewName, {group_level: 1}).then(function(result) {
							scope.hierarchy = result.rows.map(function(row) {
								var theme = themesById[row.key[0]] || {};
								return {id: row.key[0], name: theme.name, numIndicators: row.value, open: false, loaded: false};
							});
						});
					});		
				});
			}
		}
	});
