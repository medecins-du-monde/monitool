"use strict";

angular.module('monitool.directives.reporting', [])

	.directive('svgSave', function() {
		// from "https://github.com/exupero/saveSvgAsPng.git#gh-pages"

		var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

		var s = document.createElement('style');
		s.setAttribute('type', 'text/css');
		s.innerHTML = "<![CDATA[\n" + 
			'svg{background-color:white}' + 
			' svg{font:10px sans-serif} line, path{fill:none;stroke:#000} text{-webkit-user-select:none;-moz-user-select:none;user-select:none}.c3-bars path,.c3-event-rect,.c3-legend-item-tile,.c3-xgrid-focus,.c3-ygrid{shape-rendering:crispEdges}.c3-chart-arc path{stroke:#fff}.c3-chart-arc text{fill:#fff;font-size:13px}.c3-grid line{stroke:#aaa}.c3-grid text{fill:#aaa}.c3-xgrid,.c3-ygrid{stroke-dasharray:3 3}.c3-text.c3-empty{fill:gray;font-size:2em}.c3-line{stroke-width:1px}.c3-circle._expanded_{stroke-width:1px;stroke:#fff}.c3-selected-circle{fill:#fff;stroke-width:2px}.c3-bar{stroke-width:0}.c3-bar._expanded_{fill-opacity:.75}.c3-chart-arcs-title{font-size:1.3em}.c3-target.c3-focused{opacity:1}.c3-target.c3-focused path.c3-line,.c3-target.c3-focused path.c3-step{stroke-width:2px}.c3-target.c3-defocused{opacity:.3!important}.c3-region{fill:#4682b4;fill-opacity:.1}.c3-brush .extent{fill-opacity:.1}.c3-legend-item{font-size:10px}.c3-legend-background{opacity:.75;fill:#fff;stroke:#d3d3d3;stroke-width:1}.c3-tooltip-container{z-index:10}.c3-tooltip{border-collapse:collapse;border-spacing:0;background-color:#fff;empty-cells:show;-webkit-box-shadow:7px 7px 12px -9px #777;-moz-box-shadow:7px 7px 12px -9px #777;box-shadow:7px 7px 12px -9px #777;opacity:.9}.c3-tooltip tr{border:1px solid #CCC}.c3-tooltip th{background-color:#aaa;font-size:14px;padding:2px 5px;text-align:left;color:#FFF}.c3-tooltip td{font-size:13px;padding:3px 6px;background-color:#fff;border-left:1px dotted #999}.c3-tooltip td>span{display:inline-block;width:10px;height:10px;margin-right:6px}.c3-tooltip td.value{text-align:right}.c3-area{stroke-width:0;opacity:.2}.c3-chart-arcs .c3-chart-arcs-background{fill:#e0e0e0;stroke:none}.c3-chart-arcs .c3-chart-arcs-gauge-unit{fill:#000;font-size:16px}.c3-chart-arcs .c3-chart-arcs-gauge-max,.c3-chart-arcs .c3-chart-arcs-gauge-min{fill:#777}.c3-chart-arc .c3-gauge-value{fill:#000}'
			+ "\n]]>";

		var svgAsDataUri = function(el, scaleFactor, cb) {
			scaleFactor = scaleFactor || 1;

			var outer  = document.createElement("div"),
				clone  = el.cloneNode(true),
				width  = parseInt(clone.getAttribute('width') || clone.style.width || out$.getComputedStyle(el).getPropertyValue('width')),
				height = parseInt(clone.getAttribute('height') || clone.style.height || out$.getComputedStyle(el).getPropertyValue('height')),
				xmlns  = "http://www.w3.org/2000/xmlns/";

			clone.setAttribute("version", "1.1");
			clone.setAttributeNS(xmlns, "xmlns", "http://www.w3.org/2000/svg");
			clone.setAttributeNS(xmlns, "xmlns:xlink", "http://www.w3.org/1999/xlink");
			clone.setAttribute("width", width * scaleFactor);
			clone.setAttribute("height", height * scaleFactor);
			clone.setAttribute("viewBox", "0 0 " + width + " " + height);
			outer.appendChild(clone);

			clone.querySelector('defs').appendChild(s)

			var svg = doctype + outer.innerHTML;
			var uri = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
			if (cb)
				cb(uri);
		};

		var saveSvgAsPng = function(el, name, scaleFactor) {
			svgAsDataUri(el, scaleFactor, function(uri) {
				var image = new Image();
				image.src = uri;
				image.onload = function() {
					var canvas = document.createElement('canvas');
					canvas.width = image.width;
					canvas.height = image.height;
					var context = canvas.getContext('2d');
					context.drawImage(image, 0, 0);

					var a = document.createElement('a');
					a.download = name;
					a.href = canvas.toDataURL('image/png');
					document.body.appendChild(a);
					a.click();
				}
			});
		};

		return {
			restrict: "A",
			link: function(scope, element, attributes) {
				element.bind('click', function() {
					var filename;
					try { filename = [scope.query.project.name, scope.query.begin, scope.query.end].join('_') + '.png'; }
					catch (e) { filename = 'file.png'; }

					var sourceSVG = document.querySelector("svg");
					saveSvgAsPng(sourceSVG, filename, 1);
				});
			}
		}
	})

	.directive('projectCsvSave', function() {
		return {
			restrict: "A",
			link: function($scope, element, attributes) {
				var esc = function(string) { return '"' + string.replace(/"/g, '\\"') + '"'; };

				element.bind('click', function() {
					var statistics = $scope.stats.indicatorRows.concat([{type: 'header', text: '', indent: 0}]).concat($scope.stats.rawDataRows),
						csv = 'name,baseline,target,' + $scope.stats.cols.map(function(c) { return c.name; }).join(',') + "\n";

					statistics.forEach(function(row) {
						var indent = '';
						for (var i = 0; i < row.indent * 4; ++i)
							indent += '_';

						if (row.type === 'header')
							csv += esc(indent + row.text);
						else
							csv += [esc(indent + row.name), row.baseline, row.target].join(',') + ',' + row.cols.join(',');

						csv += "\n";
					});

					var blob = new Blob([csv], {type: "text/csv;charset=utf-8"}),
						name = [$scope.query.project.name, $scope.query.begin, $scope.query.end].join('_') + '.csv';

					saveAs(blob, name);
				});
			}
		};
	})

	.directive('indicatorCsvSave', function($rootScope) {
		var esc = function(string) { return '"' + string.replace(/"/g, '\\"') + '"'; };

		return {
			restrict: "A",
			link: function(scope, element, attributes) {
				element.bind('click', function() {
					var csv = 'type,name,baseline,target,' + scope.stats.cols.map(function(c) { return c.name; }).join(',') + "\n";

					scope.stats.rows.forEach(function(row) {
						var indent = row.type === 'entity' ? '____' : '';
						csv += [row.type, esc(indent + row.name), row.baseline, row.target].join(',') + ',' + row.cols.join(',');
						csv += "\n";
					});

					var blob    = new Blob([csv], {type: "text/csv;charset=utf-8"}),
						name    = [scope.query.indicator.name[$rootScope.language], scope.query.begin, scope.query.end].join('_') + '.csv';

					saveAs(blob, name);
				});
			}
		}
	})

	.directive('reportingQuery', function() {
		return {
			restrict: 'AE',
			templateUrl: 'partials/projects/reporting/query.html',
			scope: {
				query: "=query"
			},
			link: function($scope, element, attributes, controller) {
				// FIXME
				// For legacy reason, dates on this part of the code are strings.
				// Hence the hacks in this directive.
				$scope.filter = '';
				$scope.dates = {begin: new Date($scope.query.begin), end: new Date($scope.query.end)};
				
				$scope.$watch('filter', function(newFilter) {
					if (!newFilter)
						$scope.query.type = 'project';
					else if ($scope.query.project.inputEntities.find(function(entity) { return entity.id === newFilter; }))
						$scope.query.type = 'entity';
					else
						$scope.query.type = 'group';

					$scope.query.id = newFilter;
					$scope.entity   = $scope.query.project.inputEntities.find(function(e) { return e.id === newFilter; });
					$scope.group    = $scope.query.project.inputGroups.find(function(g) { return g.id === newFilter; });
				});

				$scope.$watch("dates", function() {
					$scope.query.begin = moment($scope.dates.begin).format('YYYY-MM-DD');
					$scope.query.end = moment($scope.dates.end).format('YYYY-MM-DD');
				}, true);
				
				$scope.$on('languageChange', function(e) {
					$scope.dates = angular.copy($scope.dates);
				});
			}
		};
	})

	.directive('reportingField', function() {
		return {
			link: function($scope, element, attributes, controller) {
				$scope.$watch('[presentation.display, row]', function(newValue) {
					var display = newValue[0];

					if (typeof $scope.col === "number") {
						var progress = null;

						// if baseline and target are available.
						if ($scope.row.baseline !== null && $scope.row.target !== null) {
							// compute progress 
							if ($scope.row.target === 'around_is_better')
								progress = 1 - Math.abs($scope.col - $scope.row.target) / ($scope.row.target - $scope.row.baseline);
							else
								progress = ($scope.col - $scope.row.baseline) / ($scope.row.target - $scope.row.baseline);

							// and apply color to field
							if (100 * progress < $scope.row.showRed)
								element.css('background-color', '#F88');
							else if (100 * progress < $scope.row.showYellow)
								element.css('background-color', '#FC6');
							else
								element.css('background-color', '#AFA');
						}
						else
							element.css('background-color', '');

						// display data in field
						if (display === 'value')
							element.html(Math.round($scope.col) + $scope.row.unit);
						else if (display === 'progress')
							element.html(progress !== null ? Math.round(100 * progress) + '%' : '');
						else if (display === 'raw_data')
							element.html($scope.col);
						else
							throw new Error('Invalid display value.');
					}
					else if (typeof $scope.col === "string") {
						element.html('<i class="fa fa-ban"></i>');
						element.css('background-color', '');
					}
					else {
						element.html('');
						element.css('background-color', '#eee');
					}
				}, true);
			}
		}
	})

	.directive('reportingGraphAdapter', function() {
		return {
			restrict: 'AE',
			scope: {
				'originalData': '=data',
				'plots': '=',
				'display': '=',
				'type': '='
			},
			template: '<reporting-graph type="type" data="data"></reporting-graph>',
			link: function($scope, element, attributes, controller) {
				// there is no need to subscribe to $destroy
				// $scope will be destroyed with the directive.

				$scope.$watch('[plots, originalData, display]', function() {
					if ($scope.originalData) {
						$scope.data = angular.copy($scope.originalData);

						// remove rows that are not selected.
						if (!$scope.data.rows)
							$scope.data.rows = $scope.data.rawDataRows.concat($scope.data.indicatorRows)

						$scope.data.rows = $scope.data.rows.filter(function(row) {
							return $scope.plots[row.id];
						});

						// replace value by target if required.
						if ($scope.display === 'progress')
							$scope.data.rows.forEach(function(row) {
								if (row.dataType == 'indicator')
									row.cols = row.cols.map(function(col) {
										// deal with form or aggregation conflicts.
										if (typeof col !== 'number')
											return null;

										if ($scope.display === 'value')
											return col;
										else if (row.baseline !== null && row.target !== null && col !== null) {
											if (row.target === 'around_is_better')
												return 100 * (1 - Math.abs(col - row.target) / (row.target - row.baseline));
											else
												return 100 * (col - row.baseline) / (row.target - row.baseline);							
										}
										else
											return null;
									});
							});
					}
				}, true);
			}
		};
	})

	.directive('reportingGraph', function($rootScope) {
		// This helper function allow us to get the data without totals.
		var getStatsWithoutTotal = function(stats) {
			var totalIndex = stats.cols.findIndex(function(e) { return e.id === 'total' });

			if (totalIndex !== -1) {
				var newStats = angular.copy(stats);
				newStats.rows.forEach(function(row) { row.cols.splice(totalIndex, 1); });
				newStats.cols.splice(totalIndex, 1);
			}

			return newStats || stats;
		};

		return {
			restrict: 'AE',
			template: '<div style="overflow: hidden; text-align: center"></div>',
			scope: {
				'data': '=',
				'type': '='
			},
			link: function($scope, element, attributes, controller) {
				var chartId = 'chart_' + Math.random().toString().substring(2);

				element.children().attr('id', chartId);

				// Generate chart one time, when element is created.
				var chart = c3.generate({
					size: { height: 200 },
					bindto: '#' + chartId,
					data: {x: 'x', columns: []},
					axis: {
						x: {type: "category"}
					}
				});

				// Watch all scope parameters that could make the graph to change
				var unwatch = $scope.$watch('data', function(newStats, oldStats) {
					// leave if we are loading and stats is not defined yet.
					if (newStats) {
						// Retrieve stats + list rows that we want, and those that exit the current graph
						var stats = getStatsWithoutTotal(newStats);
						
						// Create Y series
						var xSerie  = ['x'].concat(stats.cols.map(function(e) { return e.name; })),
							ySeries = stats.rows.map(function(row) {
								var name = row.name[$rootScope.language] || row.name,
									values = row.cols.map(function(v) { return v === undefined ? null : v; });
								return [name].concat(values);
							});

						// compute which rows are leaving.
						var exitingRowNames = [];
						if (oldStats)
							exitingRowNames = oldStats.rows.filter(function(oldRow) {
								return !stats.rows.find(function(newRow) { return newRow.id === oldRow.id; });
							}).map(function(row) {
								return row.name[$rootScope.language] || row.name;
							});

						chart.load({ type: $scope.type, unload: exitingRowNames, columns: [xSerie].concat(ySeries) });
					}
				}, true);

				// cleanup when done
				element.on('$destroy', function() {
					chart.destroy();
					unwatch();
				});
			}
		}
	})

	.directive('reportPreview', function() {
		return {
			restrict: 'AE',
			templateUrl: 'partials/projects/reporting/preview.html',
			scope: {
				"result": "=data"
			}
		}
	});

