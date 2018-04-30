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
import TimeSlot from 'timeslot-dag';

const module = angular.module(
	'monitool.filters.timeslot',
	[]
);

module.filter('formatSlot', function($rootScope, $locale, $filter) {

	return function(slotValue) {
		if (slotValue === '_total' || slotValue == 'total')
			return 'Total';

		else {
			var slot = new TimeSlot(slotValue);

			if (slot.periodicity === 'year')
				return slot.value;

			else if (slot.periodicity === 'semester') {
				if ($rootScope.language == 'fr') {
					var sem = {"1": "1er", "2": "2ème"}
					return sem[slot.value.substring(6)] + ' sem. ' + slot.value.substring(0, 4);
				}
				else if ($rootScope.language == 'es') {
					var sem = {"1": "Primer", "2": "Segundo"}
					return sem[slot.value.substring(6)] + ' sem. ' + slot.value.substring(0, 4);
				}
				else
					return slot.value;
			}

			else if (slot.periodicity === 'quarter') {
				if ($rootScope.language == 'fr') {
					var trim = {"1": "1er", "2": "2ème", "3": "3ème", "4": "4ème"}
					return trim[slot.value.substring(6)] + ' trim. ' + slot.value.substring(0, 4);
				}
				else if ($rootScope.language == 'es') {
					var trim = {"1": "Primer", "2": "Segundo", "3": "Tercero", "4": "Quarto"}
					return trim[slot.value.substring(6)] + ' trim. ' + slot.value.substring(0, 4);
				}
				else
					return slot.value;
			}

			else if (slot.periodicity === 'month') {
				return $locale.DATETIME_FORMATS.STANDALONEMONTH[slot.value.substring(5, 7) - 1] + ' ' + slot.value.substring(0, 4);
			}

			else if (slot.periodicity === 'month_week_sat' || slot.periodicity === 'month_week_sun' || slot.periodicity === 'month_week_mon') {
				if ($rootScope.language == 'fr' || $rootScope.language == 'es')
					return 'Sem. ' + slot.value.substring(9, 10) + ' ' + $locale.DATETIME_FORMATS.STANDALONEMONTH[slot.value.substring(5, 7) - 1] + ' ' + slot.value.substring(0, 4);
				else
					return slot.value.substring(0, 10);
			}

			else if (slot.periodicity === 'week_sat' || slot.periodicity === 'week_sun' || slot.periodicity === 'week_mon') {
				if ($rootScope.language == 'fr' || $rootScope.language == 'es')
					return 'Sem. ' + slot.value.substring(6, 8) + ' ' + slot.value.substring(0, 4);
				else
					return slot.value.substring(0, 8);
			}

			else if (slot.periodicity === 'day') {
				return $filter('date')(slot.firstDate, 'mediumDate', 'utc');
			}

			else
				throw new Error();
		}
	};
})

module.filter('formatSlotRange', function($filter) {
	return function(slotValue) {
		var slot = new TimeSlot(slotValue);
		return $filter('date')(slot.firstDate, 'fullDate', 'utc') + ' - ' + $filter('date')(slot.lastDate, 'fullDate', 'utc');
	};
});

module.filter('formatSlotLong', function($filter) {
	return function(slotValue) {
		if (slotValue === '_total' || slotValue === 'total')
			return 'Total';
		else
			return $filter('formatSlot')(slotValue) + ' (' + $filter('formatSlotRange')(slotValue) + ')';
	}
})



export default module;
