/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import angular from 'angular';
import fileSaver from 'file-saver';
import diacritics from 'diacritics';


const module = angular.module(
	'monitool.components.shared.reporting.export-csv',
	[
	]
);


// From https://gist.github.com/insin/1031969

module.component('exportCsv', {
	bindings: {},
	template: require('./export-csv.html'),
	controller: class ExportCsvController {

		onClick() {
			const table = document.getElementById('reporting');
			const tableHtml = '<table>' + this._cleanHtml(table.innerHTML) + '</table>';
			const excelXml = this._htmlToExcel(tableHtml);

			var blob = new Blob([excelXml], {type: "application/vnd.ms-excel"});
			fileSaver.saveAs(blob, 'export.xls');
		}

		/**
		 * Format an HTML file that Excel can understand easily.
		 */
		_htmlToExcel(table, name=null) {
			const template = `
				<html xmlns:o="urn:schemas-microsoft-com:office:office"
					  xmlns:x="urn:schemas-microsoft-com:office:excel"
					  xmlns="http://www.w3.org/TR/REC-html40">
					<head>
						<!--[if gte mso 9]>
							<xml>
								<x:ExcelWorkbook>
									<x:ExcelWorksheets>
										<x:ExcelWorksheet>
											<x:Name>{worksheet}</x:Name>
											<x:WorksheetOptions>
												<x:DisplayGridlines/>
											</x:WorksheetOptions>
										</x:ExcelWorksheet>
									</x:ExcelWorksheets>
								</x:ExcelWorkbook>
							</xml>
						<![endif]-->
					</head>
					<body>
						{table}
					</body>
				</html>`;

			const ctx = {worksheet: name || 'Worksheet', table: innerHTML};

			return template.replace(
				/{(\w+)}/g,
				function(m, p) {
					return ctx[p];
				}
			);
		}

		/**
		 * Remove all monitool related tags, styles, etc from the table
		 * we dumped from the DOM by hacking with regular expressions.
		 */
		_cleanHtml(innerHTML) {
			innerHTML = innerHTML.replace(/<!--[\s\S]*?-->/g, ''); // remove comments
			innerHTML = innerHTML.replace(/<i class.*?<\/i>/g, ''); // remove pictograms

			// remove checkboxes
			innerHTML = innerHTML.replace(/<input.*?>/g, '');
			innerHTML = innerHTML.replace(/<div class="btn-group btn-group-xs">[\s\S]*?<\/div>/g, '');
			innerHTML = innerHTML.replace(/<div class="btn-toolbar">[\s\S]*?<\/div>/g, '');
			innerHTML = innerHTML.replace(/<div class="btn-toolbar">[\s\S]*?<\/div>/g, '');
			innerHTML = innerHTML.replace(/<div class="pull-right">[\s\S]*?<\/div>/g, '');

			// Replace label by complete content
			innerHTML = innerHTML.replace(
				/<label for=".*?" title="(.*?)" class="ng-binding">.*?<\/label>/g,
				(match, title) => title
			);

			// Remove separators from numbers
			innerHTML = innerHTML.replace(
				/>(\d+.)+\d+</g,
				match => '>' + match.match(/\d+/g).join('') + '<'
			);

			// remove angular, classes, styles attrs
			innerHTML = innerHTML.replace(/ (ng-[a-z]+?|class|style|reporting-field|title|translate)=".*?"/g, '');

			// DIRTY: Remove accents, because there is no way to have encoding working.
			innerHTML = diacritics.remove(innerHTML);

			return innerHTML;
		}
	}
});

export default module.name;
