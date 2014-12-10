
// This not-very-well-written directive displays an accordeon with themes and types and indicators.
// The user can choose what to display for the indicator display

angular
	.module('monitool.directives.indicatorselect', [])
	.directive('indicatorSelect', function($q, mtFetch, mtDatabase) {
		return {
			templateUrl: 'partials/indicators/accordeon.html',
			restrict: "E",
			transclude: true,
			
			link: function(scope, element, attributes, controller, transclude) {

				scope.buttons = {};
				attributes.buttons.split(',').forEach(function(button) {
					scope.buttons[button] = true;
				});

				var themesById, typesById;

				$q.all([mtFetch.themesById(), mtFetch.typesById()]).then(function(result) {
					scope.themes = themesById = result[0];
					scope.types = typesById = result[1];

					scope.orderField = 'name';
					scope.hierarchy = [];
					for (var id in themesById)
						if (themesById[id].usage)
							scope.hierarchy.push({id: id, name: themesById[id].name, numIndicators: themesById[id].usage, open: false, loaded: false});
				});

				scope.toggleTheme = function(theme) {
					theme.open = !theme.open;

					if (!theme.loaded) {
						theme.loaded = true; // before callback...

						var opts = {group_level: 2, startkey: [theme.id], endkey: [theme.id, {}]};
						mtDatabase.current.query('shortlists/indicator_full_tree', opts).then(function(result) {
							theme.types = result.rows.map(function(row) {
								return {id: row.key[1], name: typesById[row.key[1]].name, numIndicators: row.value, open: false, loaded: false, indicators: []};
							});
						});
					}
				};

				scope.toggleType = function(theme, type) {
					type.open = !type.open;

					if (!type.loaded) {
						type.loaded = true; // before callback...

						var opts = {reduce: false, startkey: [theme.id, type.id], endkey: [theme.id, type.id, {}]};
						mtDatabase.current.query('shortlists/indicator_full_tree', opts).then(function(result) {
							type.indicators = result.rows.map(function(row) { return {id: row.id, name: row.value}; });

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
			}
		}
	});
