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

import menu from './menu/menu.js';
import ccIndicatorList from './admin/cc-indicator-list.js';
import userList from './admin/user-list.js';
import adminMenu from './admin/menu.js';
import themeList from './admin/theme-list.js';
import home from './home/home.js';
import projectMenu from './project/menu/menu.js';
import projectList from './project/list/list.js';
import inputEdition from './project/input/input-edition.js';
import inputList from './project/input/input-list.js';
import reportingMenu from './project/reporting/menu.js';
import olap from './project/reporting/olap.js';
import general from './project/reporting/general.js';
import detailed from './project/reporting/detailed.js';
import prjCcIndicatorList from './project/structure/cc-indicator-list.js';
import sites from './project/structure/sites.js';
import history from './project/structure/history.js';
import logframeList from './project/structure/logframe-list.js';
import dsList from './project/structure/data-source-list.js';
import prjUserList from './project/structure/user-list.js';
import basics from './project/structure/basics.js';
import structureMenu from './project/structure/menu.js';
import dsEdit from './project/structure/data-source-edit.js';
import extraIndicators from './project/structure/extra-indicators.js';
import logframeEdit from './project/structure/logframe-edit.js';
import repIndicatorList from './cc-indicator/cc-indicator-list.js';
import ccIndicatorReporting from './cc-indicator/cc-indicator-reporting.js';


export default angular.module(
	'monitool.components.pages.all-pages',
	[
		menu.name,
		ccIndicatorList.name,
		userList.name,
		adminMenu.name,
		themeList.name,
		home.name,
		projectMenu.name,
		projectList.name,
		inputEdition.name,
		inputList.name,
		reportingMenu.name,
		olap.name,
		general.name,
		detailed.name,
		prjCcIndicatorList.name,
		sites.name,
		history.name,
		logframeList.name,
		dsList.name,
		prjUserList.name,
		basics.name,
		structureMenu.name,
		dsEdit.name,
		extraIndicators.name,
		logframeEdit.name,
		repIndicatorList.name,
		ccIndicatorReporting.name,
	]
);

