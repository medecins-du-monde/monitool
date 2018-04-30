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

import basicsPage from './basics/module';
import crossCuttingPage from './cross-cutting/module';
import dataSourcePage from './data-source/module';
import extraIndicatorPage from './extra-indicator/module';
import logicalFrameworkPage from './logical-framework/module';
import menuPage from './menu/module';
import revisionPage from './revision/module';
import sitePage from './site/module';
import userPage from './user/module';


export default angular.module(
	'monitool.pages.project.structure',
	[
		basicsPage.name,
		crossCuttingPage.name,
		dataSourcePage.name,
		extraIndicatorPage.name,
		logicalFrameworkPage.name,
		menuPage.name,
		revisionPage.name,
		sitePage.name,
		userPage.name
	]
);

