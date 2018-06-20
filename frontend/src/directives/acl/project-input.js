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


const module = angular.module(
	'monitool.directives.acl.projectinput',
	[]
);


const isAllowedForm = function(userCtx, scope, element, attributes) {
	var project = scope.$eval(attributes.aclProject),
		askedFormId = scope.$eval(attributes.aclHasInputForm) || scope.$eval(attributes.aclLacksInputForm);

	if (userCtx.type === 'user') {
		var internalUser = project.users.find(u => u.id == userCtx._id);
		return userCtx.role === 'admin' || project.canInputForm(internalUser, askedFormId);
	}
	else if (userCtx.type === 'partner')
		return project.canInputForm(userCtx, askedFormId)

	else
		throw new Error('Invalid userCtx.type value');
};


module.directive('aclHasInputForm', function($rootScope) {
	return {
		link: function(scope, element, attributes) {
			var isAllowed = isAllowedForm($rootScope.userCtx, scope, element, attributes);
			if (!isAllowed)
				element.remove();
		}
	}
});


module.directive('aclLacksInputForm', function($rootScope) {
	return {
		link: function(scope, element, attributes) {
			var isAllowed = isAllowedForm($rootScope.userCtx, scope, element, attributes);
			if (isAllowed)
				element.remove();
		}
	}
});


export default module;
