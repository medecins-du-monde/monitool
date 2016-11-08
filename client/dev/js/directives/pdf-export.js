"use strict";

angular

	.module('monitool.directives.pdfExport', [])
	
	.directive('pdfExportSource', function($filter, itertools) {

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


		var elementToDocDefinition = function(element) {
			var permutation = itertools.computeNthPermutation(element.partitions.length, element.order),
				partitions = permutation.map(function(index) { return element.partitions[index]; });

			var body, widths;

			var colPartitions = partitions.slice(element.distribution),
				rowPartitions = partitions.slice(0, element.distribution);

			var topRows = makeRows(colPartitions),
				bodyRows = itertools.transpose2D(makeRows(rowPartitions));

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
				for (var i = 0; i < rowPartitions.length; ++i)
					topRow.unshift('');
			});

			body = topRows.concat(bodyRows);

			widths = [];
			for (var i = 0; i < rowPartitions.length; ++i)
				widths.push('auto');
			for (var j = 0; j < dataColsPerRow; ++j)
				widths.push('*');

			return  [
				{style: "variableName", text: element.name},
				{
					table: {
						headerRows: colPartitions.length,
						widths: widths,
						body: body
					}
				}
			];
		};

		var dataSourceToDocDefinition = function(source, format) {
			return {
				pageSize: "A4",
				pageOrientation: format,

				content: [
					{image: "logo", width: 80, absolutePosition: {x: format == 'portrait' ? 480 : 720, y:15}},
					{text: source.name, style: 'header'},
					{text: $filter('translate')('project.general_info'), style: "header2"},
					{style: "variableName", text: $filter('translate')('project.collection_site')},
					{table: {headerRows: 0, widths: ['*'], body: [[' ']]}},
					{style: "variableName", text: $filter('translate')('project.covered_period')},
					{table: {headerRows: 0, widths: ['*'], body: [[' ']]}},
					{style: "variableName", text: $filter('translate')('project.collected_by')},
					{table: {headerRows: 0, widths: ['*'], body: [[' ']]}},
					{text: $filter('translate')('project.data'), style: "header2"}
				].concat(source.elements.map(elementToDocDefinition)),

				styles: {
					header: {
						fontSize: 22,
						bold: true,
						alignment: 'center',
						margin: [100, 0, 100, 0]
					},
					header2: {
						fontSize: 18,
						bold: true,
						margin: [0, 15, 0, 0]
					},
					variableName: {
						fontSize: 12,
						bold: true,
						margin: [0, 10, 0, 5]
					}
				},

				images: {
					logo: "data:image/png;base64," + 
						"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" +
						"YII="
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
					var docDef = dataSourceToDocDefinition(scope.form, attributes.format || 'portrait');
					pdfMake.createPdf(angular.copy(docDef)).open();
				});
			}
		}
	})

