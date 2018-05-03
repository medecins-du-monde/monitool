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
	'monitool.components.reporting.exportcsv',
	[
	]
);


module.directive('csvSave', function() {
	// From https://gist.github.com/insin/1031969
	var tableToExcel = (function() {
		var uri = 'data:application/vnd.ms-excel;base64,',
			template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
			base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) },
			format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) };

		return function(table, name) {
			if (!table.nodeType)
				table = document.getElementById(table)

			var innerHTML = table.innerHTML;
			innerHTML = innerHTML.replace(/<!--[\s\S]*?-->/g, ''); // remove comments
			innerHTML = innerHTML.replace(/<i class.*?<\/i>/g, ''); // remove pictograms

			// remove checkboxes
			innerHTML = innerHTML.replace(/<input.*?>/g, '');
			innerHTML = innerHTML.replace(/<div class="btn-group btn-group-xs">[\s\S]*?<\/div>/g, '');
			innerHTML = innerHTML.replace(/<div class="btn-toolbar">[\s\S]*?<\/div>/g, '');
			innerHTML = innerHTML.replace(/<div class="btn-toolbar">[\s\S]*?<\/div>/g, '');
			innerHTML = innerHTML.replace(/<div class="pull-right">[\s\S]*?<\/div>/g, '');

			// Replace label by complete content
			innerHTML = innerHTML.replace(/<label for=".*?" title="(.*?)" class="ng-binding">.*?<\/label>/g, function(match, title) {
				return title;
			});

			// Remove separators from numbers
			innerHTML = innerHTML.replace(/>(\d+.)+\d+</g, function(match) {
				var numbers = match.match(/\d+/g);
				return '>' + numbers.join('') + '<';
			});

			// remove angular, classes, styles attrs
			innerHTML = innerHTML.replace(/ (ng-[a-z]+?|class|style|reporting-field|title|translate)=".*?"/g, '');

			// DIRTY: Remove accents, because there is no way to have encoding working.
			innerHTML = diacritics.remove(innerHTML);

			var ctx = {worksheet: name || 'Worksheet', table: innerHTML};


			var blob = new Blob([format(template, ctx)], {type: "application/vnd.ms-excel"});
			fileSaver.saveAs(blob, 'export.xls');
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
});

export default module;
