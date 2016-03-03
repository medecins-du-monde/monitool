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

	.directive('csvSave', function() {
		// From https://gist.github.com/insin/1031969
		var tableToExcel = (function() {
			var uri = 'data:application/vnd.ms-excel;base64,', 
				template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>', 
				base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) }, 
				format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) };

			return function(table, name) {
				if (!table.nodeType)
					table = document.getElementById(table)

				var ctx = {worksheet: name || 'Worksheet', table: table.innerHTML};
				// window.location.href = uri + base64(format(template, ctx));

				var blob = new Blob([format(template, ctx)], {type: "application/vnd.ms-excel"});
				saveAs(blob, 'export.xls');
			};
		})()

		return {
			restrict: 'A',
			link: function($scope, element, attributes) {
				element.on('click', function(e) {
					tableToExcel('reporting');
					e.preventDefault();
				});

				// <-- event handler leak
				// $scope.on('$destroy', function() {
				// 	element.off('click');
				// });
			}
		};
	})

	.directive('activityReportingField', function() {
		return {
			scope: false,
			link: function($scope, element, attributes, controller) {
				$scope.$watch('col', function(value) {
					if (typeof value === "string") {
						// element.html('<span style="font-size: 6px">' + value + '</span>');
						element.html('<i class="fa fa-ban"></i>');
						element.css('background-color', '');
					}
					else if (Number.isNaN(value)) {
						element.html('<i class="fa fa-exclamation-triangle"></i>');
						element.css('background-color', '');
					}
					else if (typeof value === "number") {
						// if baseline and target are available.
						element.css('background-color', '');
						element.html(Math.round(value));
					}
					else {
						element.html('');
						element.css('background-color', '#eee');
					}
				}, true);
			}
		}
	})

	.directive('indicatorReportingField', function() {
		return {
			scope: false,
			link: function($scope, element, attributes, controller) {

				$scope.$watch('col', function(value) {
					if (typeof value === "string") {
						// element.html('<span style="font-size: 6px">' + value + '</span>');
						element.html('<i class="fa fa-ban"></i>');
						element.css('background-color', '');
					}
					else if (Number.isNaN(value)) {
						element.html('<i class="fa fa-exclamation-triangle"></i>');
						element.css('background-color', '');
					}
					else if (typeof value === "number") {
						// if baseline and target are available.
						if ($scope.row.colorize && $scope.row.baseline !== null && $scope.row.target !== null) {
							var progress = null;
							var baseline = parseInt($scope.row.baseline), target = parseInt($scope.row.target);

							// compute progress 
							if ($scope.row.targetType === 'around_is_better')
								progress = 1 - Math.abs(value - target) / (target - baseline);
							else
								progress = (value - baseline) / (target - baseline);

							// and apply color to field
							if (progress < .333)
								element.css('background-color', '#F88');
							else if (progress < .667)
								element.css('background-color', '#FC6');
							else
								element.css('background-color', '#AFA');
						}
						else
							element.css('background-color', '');

						if ($scope.row.unit == 'none')
							element.html(Math.round(value));
						else
							element.html(Math.round(value) + $scope.row.unit);
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
				cols: '=',
				originalRows: '=rows',
				plots: '=',
				type: '='
			},
			template: '<reporting-graph type="type" data="data"></reporting-graph>',
			link: function($scope, element, attributes, controller) {
				// there is no need to subscribe to $destroy
				// $scope will be destroyed with the directive.

				$scope.$watch('[plots, originalRows]', function() {
					if (!$scope.originalRows)
						return;

					$scope.data = {
						cols: $scope.cols,
						rows: angular.copy($scope.originalRows).filter(function(row) {
							return $scope.plots[row.id];
						})
					};
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
				// FIXME shouldn't this be an event on the scope?
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
	})


	.directive('olapGrid', function(itertools) {
		return {
			restrict: 'E',
			scope: {
				cols: '=',
				rows: '=',
				data: '=',
				filters: '='
			},
			templateUrl: "partials/projects/activity/_olap_grid.html",

			link: function($scope, element) {
				$scope.$watch('[cols,rows,data,filters]', function() {
					// Create empty grid.
					var grid = {header: [], body: []};
					
					// Create header rows.
					var totalCols = $scope.cols.reduce(function(memo, col) { return memo * col.items.length; }, 1),
						colspan = totalCols, // current colspan is total number of columns.
						numCols = 1; // current numCols is 1.

					for (var i = 0; i < $scope.cols.length; ++i) {
						// adapt colspan and number of columns
						colspan /= $scope.cols[i].items.length; 
						numCols *= $scope.cols[i].items.length;

						// Create header row
						var row = {colspan: colspan, cols: []};
						for (var k = 0; k < numCols; ++k)
							row.cols.push($scope.cols[i].items[k % $scope.cols[i].items.length]);

						grid.header.push(row);
					}

					// Create data rows.
					$scope.rowspans = [];
					var rowspan = $scope.rows.reduce(function(memo, row) { return memo * row.items.length; }, 1);
					for (var i = 0; i < $scope.rows.length; ++i) {
						rowspan /= $scope.rows[i].items.length;
						$scope.rowspans[i] = rowspan;
					}

					itertools.product($scope.rows.pluck('items')).forEach(function(headers) {
						grid.body.push({
							headerCols: headers,
							dataCols:
								itertools.product(
									$scope.cols.pluck('items').concat(headers.map(function(a) { return [a]; }))
								).map(function(els) {
									try {
										var result = $scope.data;
										var numEls = els.length;
										for (var i =0 ; i < numEls; ++i)
											result = result[els[i]];
										return result;
									}
									catch (e) {
										return null;
									}
								})
						});
					});

					$scope.grid = grid;
				}, true);
			}
		}
	})

