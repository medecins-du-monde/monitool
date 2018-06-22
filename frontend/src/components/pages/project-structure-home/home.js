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
import uiRouter from '@uirouter/angularjs';

import faOk from '../../shared/misc/check-times-icon';

const module = angular.module(
	'monitool.components.pages.project.structure.home',
	[
		uiRouter, // for $stateProvider
		faOk.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.structure.home', {
		url: '/structure-home',
		component: 'projectStructureHome',
	});

});


module.component('projectStructureHome', {

	bindings: {
		project: '<',
		ccIndicators: '<'
	},

	template: require('./home.html'),

	controller: class ProjectStructureHomeController {

		$onChanges(changes) {
			const lfIndicators = this.project.logicalFrames.reduce((memo, lf) => [
				...memo,
				...lf.indicators,
				...lf.purposes.reduce((memo, purpose) => [
					...memo,
					...purpose.indicators,
					...purpose.outputs.reduce((memo, output) => [
						...memo,
						...output.indicators,
						...output.activities.reduce((memo, activity) => [
							...memo,
							...activity.indicators
						], [])
					], [])
				], [])
			], []);

			this.lfIndicatorsDone = lfIndicators.filter(i => !!i.computation).length;
			this.lfIndicatorsTotal = lfIndicators.length;

			const ccIndicators = this.ccIndicators.filter(i => i.themes.some(t => this.project.themes.includes(t)));

			this.ccIndicatorsDone = ccIndicators.filter(i => !!this.project.crossCutting[i._id]).length;
			this.ccIndicatorsTotal = ccIndicators.length;

			this.extraIndicatorsDone = this.project.extraIndicators.filter(i => !!i.computation).length;
			this.extraIndicatorsTotal = this.project.extraIndicators.length;
		}

	}
});


export default module;

