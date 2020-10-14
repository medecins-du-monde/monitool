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
import exprEval from 'expr-eval';

const module = angular.module(
	'directives.validators.expression',
	[
	]
);


module.directive('expression', function() {
	return {
		restrict: 'A',
		require: '?ngModel',
		link: function($scope, $element, attributes, controller) {
			if (!controller)
				return;

			controller.$validators.expression = function(value) {
				try {
					exprEval.Parser.parse(value);
					return true
				}
				catch (e) {
					return false;
				}
			};

			controller.$validate();
		}
	}
});

export default module.name;
