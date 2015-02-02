
// This not-very-well-written directive displays an accordeon with themes and types and indicators.
// The user can choose what to display for the indicator display

angular
	.module('monitool.directives.indicatorselect', [])
	.directive('indicatorSelect', function($q, mtFetch) {
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

				// Load all themes and types.
				$q.all([mtFetch.themesById(), mtFetch.typesById()]).then(function(result) {
					// load themes and types and pass them to the view.
					scope.themes = themesById = result[0];
					scope.types = typesById = result[1];

					// decide which buttons are visible...
					scope.buttons = {};
					attributes.buttons.split(',').forEach(function(button) {
						scope.buttons[button] = true;
					});
					
					// start up
					scope.$watch('standard', function(standard) {
						scope.hierarchy = [];
						mtFetch.indicators({mode: 'tree_level_1', standard: standard}).then(function(data) {
							scope.hierarchy = data.map(function(row) {
								var theme = themesById[row.themeId] || {};
								return {
									id: row.themeId,
									name: theme.name,
									numIndicators: row.indicators,
									open: false,
									loaded: false
								}
							});
						});
					});
				});

				scope.toggleTheme = function(theme) {
					theme.open = !theme.open;

					if (!theme.loaded) {
						theme.loaded = true; // before callback...

						mtFetch.indicators({mode: 'tree_level_2', standard: scope.standard, themeId: theme.id}).then(function(data) {
							theme.types = data.map(function(row) {
								var type = typesById[row.typeId] || {};
								return {
									id: row.typeId,
									name: type.name,
									numIndicators: row.indicators,
									open: false,
									loaded: false,
									indicators: []
								};
							});
						});
					}
				};

				scope.toggleType = function(theme, type) {
					type.open = !type.open;

					if (!type.loaded) {
						type.loaded = true; // before callback...

						mtFetch.indicators({mode: 'tree_level_3', standard: scope.standard, themeId: theme.id, typeId: type.id}).then(function(data) {
							type.indicators = data.map(function(row) {
								return {
									id: row._id,
									name: row.name,
									standard: row.standard,
									main: row.__mainUsage,
									input: row.__inputUsage
								};
							});
						});
					}
				};
			}
		}
	});
