"use strict";

angular.module('monitool.directives.acl', [])

	.service('_makeReadOnly', function() {
		return function(scope, element, attributes) {
			// replace by raw text
			if (attributes.mtContentEditable !== undefined || attributes.contenteditable !== undefined) {
				element.removeAttr('mt-content-editable');
				element.removeAttr('contenteditable');
				element.removeAttr('ng-model');
			}
			
			else if (attributes.aclFallback) {
				var fallback = scope.$eval(attributes.aclFallback) || '';

				// handle boolean and dates case.
				if (fallback === true)
					fallback = '<i class="fa fa-check" style="color: green"></i>';
				
				else if (fallback === false)
					fallback = '<i class="fa fa-times" style="color: red"></i>';
				
				else if (Object.prototype.toString.call(fallback) === '[object Date]')
					fallback = $filter('date')(fallback, 'longDate', 'UTC');

				// Nest in a form-control-static if needed.
				if (element.parent().hasClass('form-group'))
					fallback = '<p class="form-control-static">' + fallback + '</p>';

				element.html(fallback.toString());
			}
			// Just remove editable properties
			else {
				element.remove();
			}
		};
	})
 
	.service('_isAllowedProject', function() {

		return function(userCtx, scope, element, attributes) {
			var project = scope.project || scope.$eval(attributes.aclProject),
				role    = attributes.aclHasProjectRole || attributes.aclLacksProjectRole;

			if (role !== 'owner' && role !== 'input')
				throw new Error("acl-has-project-role must be called with either 'owner' or 'input'");

			var isAllowed = false;
			if (userCtx.type == 'user') {
				if (userCtx.roles.indexOf('_admin') !== -1)
					isAllowed = true;
				else {
					var internalUser = project.users.find(function(u) { return u.id == userCtx._id; });
					if (internalUser) {
						if (role == 'owner' && internalUser.role == 'owner')
							isAllowed = true;
						else if (role == 'input' && (internalUser.role == 'owner' || internalUser.role == 'input' || internalUser.role == 'input_all'))
							isAllowed = true;
					}
				}
			}
			else if (userCtx.type == 'partner') {
				// we know that this is the right project already, because partner as no
				// routes to reach other projects, but just in case.
				if (userCtx.projectId == project._id) {
					if (role == 'owner' && userCtx.role == 'owner')
						isAllowed = true;
					else if (role == 'input' && (userCtx.role == 'owner' || userCtx.role == 'input' || internalUser.role == 'input_all'))
						isAllowed = true;
				}
			}
			else
				throw new Error('invalid user type');
			
			return isAllowed;	
		};
	})

	.directive('aclHasRole', function($rootScope, _makeReadOnly) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var roles = userCtx.roles || [],
						isAllowed =
							userCtx.type == 'user' && // partners cannot do anything
							(roles.indexOf(attributes.aclHasRole) !== -1 || roles.indexOf('_admin') !== -1);

					if (!isAllowed)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})
	.directive('aclHasProjectRole', function($rootScope, _makeReadOnly, _isAllowedProject) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedProject(userCtx, scope, element, attributes);
					if (!isAllowed)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})
	.directive('aclLacksRole', function($rootScope, _makeReadOnly) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var roles = userCtx.roles || [],
						isForbidden = 
							userCtx.type != 'user' || // partners cannot do anything
							(roles.indexOf(attributes.aclLacksRole) === -1 && roles.indexOf('_admin') === -1);

					if (!isForbidden)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})
	.directive('aclLacksProjectRole', function($rootScope, _makeReadOnly, _isAllowedProject) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedProject(userCtx, scope, element, attributes);
					if (isAllowed)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	});
