"use strict";

angular

	.module('monitool.directives.pdfExport', [])
	
	.directive('pdfExportSource', function() {

		var makeRows = function(partitions) {
			var totalCols = partitions.reduce(function(memo, tp) { return memo * tp.elements.length; }, 1),
				currentColSpan = totalCols;

			var body = [];

			// Create header rows for top partitions
			partitions.forEach(function(tp) {
				// Update currentColSpan
				currentColSpan /= tp.elements.length;

				// Create header row
				var row = [];

				// Add one field for each element in tp, with current colspan
				for (var colIndex = 0; colIndex < totalCols; ++colIndex) {
					// Add field
					var tpe = tp.elements[(colIndex / currentColSpan) % tp.elements.length];
					row.push({colSpan: currentColSpan, text: tpe.name});

					// Add as many fillers as the colSpan value - 1
					var colLimit = colIndex + currentColSpan - 1;
					for (; colIndex < colLimit; ++colIndex)
						row.push("");
				}

				// push to body
				body.push(row);
			});

			return body;
		};

		var transpose = function(rows) {
			if (rows.length === 0)
				return [];

			var result = new Array(rows[0].length);

			for (var x = 0; x < rows[0].length; ++x) {
				result[x] = new Array(rows.length);

				for (var y = 0; y < rows.length; ++y) {
					result[x][y] = angular.copy(rows[y][x]);

					if (result[x][y].colSpan) {
						result[x][y].rowSpan = result[x][y].colSpan;
						delete result[x][y].colSpan;
					}
					else if (result[x][y].rowSpan) {
						result[x][y].colSpan = result[x][y].rowSpan;
						delete result[x][y].rowSpan;
					}
				}
			}

			return result;
		};

		var elementToDocDefinition = function(element) {
			var body, widths;

			// if (element.colPartitions.length == 0 && element.rowPartitions.length == 0) {
			// 	body = [[' ']];
			// 	widths = ['*'];
			// }
			
			// else if (element.colPartitions.length == 0 && element.rowPartitions.length == 1) {
			// 	body = element.rowPartitions[0].elements.map(function(e) { return [e.name, '']; });
			// 	widths = ['auto', '*'];
			// }

			// else if (element.colPartitions.length == 1 && element.rowPartitions.length == 0) {
			// 	body = [
			// 		element.colPartitions[0].elements.map(function(e) { return e.name; }),
			// 		element.colPartitions[0].elements.map(function(e) { return ' '; })
			// 	]

			// 	widths = element.colPartitions[0].elements.map(function(e) { return '*'; });
			// }
			
			// else {
				var topRows = makeRows(element.colPartitions),
					bodyRows = transpose(makeRows(element.rowPartitions));

				if (!bodyRows.length)
					bodyRows.push([])

				var dataColsPerRow = topRows.length ? topRows[0].length : 1;

				// Add empty data fields to bodyRows
				bodyRows.forEach(function(bodyRow) {
					for (var i = 0; i < dataColsPerRow; ++i)
						bodyRow.push(' ');
				});

				// Add empty field in the top-left corner for topRows
				topRows.forEach(function(topRow, index) {
					for (var i = 0; i < element.rowPartitions.length; ++i)
						topRow.unshift('');
				});

				body = topRows.concat(bodyRows);

				widths = [];
				for (var i = 0; i < element.rowPartitions.length; ++i)
					widths.push('auto');
				for (var j = 0; j < dataColsPerRow; ++j)
					widths.push('*');
			// }

			return  [
				{style: "variableName", text: element.name},
				{
					table: {
						headerRows: element.colPartitions.length,
						widths: widths,
						body: body
					}
				}
			];
		};

		var dataSourceToDocDefinition = function(source) {
			var title = {text: source.name, style: 'header'},
				rows  = source.elements.map(elementToDocDefinition);

			return {
				pageSize: "A4",
				pageOrientation: "portrait",

				content: [title].concat(rows),

				styles: {
					header: {
						fontSize: 22,
						bold: true,
						alignment: 'center'
					},
					variableName: {
						fontSize: 12,
						bold: true,
						margin: [0, 20, 0, 5]
					}
				}
			};
		};

		return {
			restrict: 'A',
			scope: {
				form: '=pdfExportSource'
			},
			link: function(scope, element, attributes) {
				element.bind('click', function(e) {
					var docDef = dataSourceToDocDefinition(scope.form);
					console.log(docDef);
					pdfMake.createPdf(angular.copy(docDef)).open();
				});
			}
		}
	})

