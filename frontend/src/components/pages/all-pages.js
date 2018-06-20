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
import ccIndicatorList from './admin-cc-indicator/cc-indicator-list.js';
import userList from './admin-user/user-list.js';
import adminMenu from './admin-menu/menu.js';
import themeList from './admin-theme/theme-list.js';

import home from './home/home.js';

import repIndicatorList from './cc-indicators/cc-indicator-list.js';
import ccIndicatorReporting from './cc-indicators/cc-indicator-reporting.js';

import projectMenu from './project-menu/menu.js';
import projectList from './project-list/list.js';

import structureMenu from './project-structure-menu/menu.js';
import basics from './project-structure-basics/basics.js';
import sites from './project-structure-sites/sites.js';
import dsList from './project-structure-data-source/data-source-list.js';
import dsEdit from './project-structure-data-source/data-source-edit.js';
import prjCcIndicatorList from './project-structure-cc-indicators/cc-indicator-list.js';
import logframeList from './project-structure-logical-frame/logframe-list.js';
import logframeEdit from './project-structure-logical-frame/logframe-edit.js';
import prjUserList from './project-structure-user/user-list.js';
import extraIndicators from './project-structure-extra-indicators/extra-indicators.js';
import history from './project-structure-history/history.js';

import inputList from './project-input/input-list.js';
import inputEdition from './project-input/input-edition.js';

import general from './project-reporting-general/general.js';
import detailed from './project-reporting-detailed/detailed.js';
import olap from './project-reporting-olap/olap.js';

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

