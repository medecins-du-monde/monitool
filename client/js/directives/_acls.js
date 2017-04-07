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

"use strict";

angular.module('monitool.directives.acl', [])
 
	.service('_isAllowedProject', function() {

		return function(userCtx, scope, element, attributes) {
			// FIXME: shouldn't this be the other way around? $eval(attr) || defaultValue
			var project = scope.masterProject || scope.$eval(attributes.aclProject),
				askedRole    = attributes.aclHasProjectRole || attributes.aclLacksProjectRole;

			if (askedRole !== 'owner' && askedRole !== 'input')
				throw new Error("acl-has-project-role must be called with either 'owner' or 'input'");

			if (askedRole === 'owner') {
				if (userCtx.type === 'user') {
					var internalUser = project.users.find(function(u) { return u.id == userCtx._id; });
					return userCtx.role === 'admin' || (internalUser && internalUser.role === 'owner');
				}

				else if (userCtx.type === 'partner') {
					return userCtx.projectId === project._id && userCtx.role === 'owner';
				}
				
				else
					throw new Error('Invalid userCtx.type value');
			}
			else if (askedRole === 'input') {
				if (userCtx.type === 'user') {
					var internalUser = project.users.find(function(u) { return u.id == userCtx._id; });
					return userCtx.role === 'admin' || internalUser && ['owner', 'input'].indexOf(internalUser.role) !== -1;
				}

				else if (userCtx.type === 'partner')
					return userCtx.projectId === project._id && ['owner', 'input'].indexOf(userCtx.role) !== -1;

				else
					throw new Error('Invalid userCtx.type value');
			}
			else
				throw new Error('Invaldi asked role');
		};
	})

	.service('_isAllowedForm', function() {
		return function(userCtx, scope, element, attributes) {
			var project = scope.masterProject || scope.$eval(attributes.aclProject),
				askedFormId = scope.$eval(attributes.aclHasInputForm) || scope.$eval(attributes.aclLacksInputForm);

			if (userCtx.type === 'user') {
				var internalUser = project.users.find(function(u) { return u.id == userCtx._id; });
				return userCtx.role === 'admin' || project.canInputForm(internalUser, askedFormId);
			}
			else if (userCtx.type === 'partner') {
				return project.canInputForm(userCtx, askedFormId)
			}
			else
				throw new Error('Invalid userCtx.type value');

			return project.canInputForm()
		};
	})

	.directive('aclHasInputForm', function($rootScope, _isAllowedForm) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedForm(userCtx, scope, element, attributes);
					if (!isAllowed)
						element.remove();
					
					unwatch();
				});
			}
		}
	})

	.directive('aclLacksInputForm', function($rootScope, _isAllowedForm) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedForm(userCtx, scope, element, attributes);
					if (isAllowed)
						element.remove();
					
					unwatch();
				});
			}
		}
	})


	.directive('aclHasAdministration', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type !== 'user' || userCtx.role !== 'admin')
						element.remove();

					unwatch();
				});
			}
		}
	})

	.directive('aclLacksAdministration', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type === 'user' && userCtx.role === 'admin')
						element.remove();

					unwatch();
				});
			}
		}
	})


	.directive('aclHasProjectCreation', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type !== 'user' || userCtx.role === 'common')
						element.remove();

					unwatch();
				});
			}
		}
	})

	.directive('aclLacksProjectCreation', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type === 'user' && userCtx.role !== 'common')
						element.remove();

					unwatch();
				});
			}
		}
	})

	.directive('aclHasProjectRole', function($rootScope, _isAllowedProject) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedProject(userCtx, scope, element, attributes);
					if (!isAllowed)
						element.remove();

					unwatch();
				});
			}
		}
	})

	.directive('aclLacksProjectRole', function($rootScope, _isAllowedProject) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedProject(userCtx, scope, element, attributes);
					if (isAllowed)
						element.remove();

					unwatch();
				});
			}
		}
	});
