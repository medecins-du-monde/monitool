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

import TimeSlot, {timeSlotRange} from 'timeslot-dag';

export default class Dimension {

	static createTime(project, form, element, inputs) {
		var periods;

		if (form.periodicity === 'free') {
			periods = {};
			inputs.forEach(input => periods[input.period] = true);
			periods = Object.keys(periods);
			periods.sort();

			return new Dimension(form.periodicity === 'free' ? 'day' : form.periodicity, periods, element.timeAgg);
		}
		else {
			// max(project.start, form.start)
			const start = [project.start, form.start].filter(a => a).sort().pop();
			// min(project.end, form.end, new Date())
			const end = [project.end, form.end, new Date().toISOString().substring(0, 10)].sort().shift();

			periods = Array
				.from(
					timeSlotRange(
						TimeSlot.fromDate(new Date(start + 'T00:00:00Z'), form.periodicity),
						TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), form.periodicity)
					)
				)
				.map(ts => ts.value)

			return new Dimension(form.periodicity, periods, element.timeAgg);
		}
	}

	static createLocation(project, form, element) {
		return new Dimension('entity', form.entities, element.geoAgg);
	}

	static createPartition(partition) {
		return new Dimension(
			partition.id,
			partition.elements.map(function(e) { return e.id; }),
			partition.aggregation
		);
	};

	/**
	 * id = "month"
	 * items = ["2010-01", "2010-02", ...]
	 * aggregation = "sum"
	 */
	constructor(id, items, aggregation) {
		this.id = id;
		this.items = items;
		this.aggregation = aggregation;
	}
}
