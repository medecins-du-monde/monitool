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
	'monitool.services.utils.input-slots',
	[]
);

module.factory('InputSlots', function() {
	var InputSlots = {};

	InputSlots.minDate = function(dates) {
		return dates.reduce(function(d, memo) { return !memo || memo > d ? d : memo; });
	};

	InputSlots.maxDate = function(dates) {
		return dates.reduce(function(d, memo) { return !memo || memo < d ? d : memo; });
	};

	InputSlots.iterate = function(begin, end, periodicity) {
		var now = TimeSlot.fromDate(new Date(), periodicity);

		var slot = TimeSlot.fromDate(new Date(begin + 'T00:00:00Z'), periodicity),
			endSlot = TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), periodicity);

		if (now.value < slot.value)
			return [];

		if (now.value < endSlot.value)
			endSlot = now;

		var slots = [];
		while (slot.value < endSlot.value) {
			slots.push(slot.value);
			slot = slot.next();
		}
		slots.push(slot.value);

		return slots;
	};

	InputSlots.getList = function(project, entity, form) {
		var start = InputSlots.maxDate([project.start, entity ? entity.start : null, form.start]),
			end   = InputSlots.minDate([project.end, entity ? entity.end : null, form.end]),
			list  = InputSlots.iterate(start, end, form.periodicity);

		return list;
	};

	return InputSlots;
})


export default module;
