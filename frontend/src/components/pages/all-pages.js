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

import menu from './menu/menu';
import ccIndicatorList from './admin-cc-indicator/cc-indicator-list';
import userList from './admin-user/user-list';
import adminMenu from './admin-menu/menu';
import themeList from './admin-theme/theme-list';

import home from './home/home';

import repIndicatorList from './cc-indicators/cc-indicator-list';
import ccIndicatorReporting from './cc-indicators/cc-indicator-reporting';

import projectMenu from './project-menu/menu';
import projectList from './project-list/list';

import structureMenu from './project-structure-menu/menu';
import basics from './project-structure-basics/basics';
import sites from './project-structure-sites/sites';
import dsList from './project-structure-data-source/data-source-list';
import dsEdit from './project-structure-data-source/data-source-edit';
import prjCcIndicatorList from './project-structure-cc-indicators/cc-indicator-list';
import logframeList from './project-structure-logical-frame/logframe-list';
import logframeEdit from './project-structure-logical-frame/logframe-edit';
import prjUserList from './project-structure-user/user-list';
import extraIndicators from './project-structure-extra-indicators/extra-indicators';
import history from './project-structure-history/history';

import inputList from './project-input-list/input-list';
import inputEdition from './project-input-edition/input-edition';

import general from './project-reporting-general/general';
import olap from './project-reporting-olap/olap';


import projectInputmenu from './project-input-menu/menu';
import projectReportingmenu from './project-reporting-menu/menu';
import projectStructureHome from './project-structure-home/home';
import projectInputHome from './project-input-home/home';
import projectReportingHome from './project-reporting-home/home';

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
		olap.name,
		general.name,
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

		projectInputmenu.name,
		projectReportingmenu.name,
		projectStructureHome.name,
		projectInputHome.name,
		projectReportingHome.name
	]
);

