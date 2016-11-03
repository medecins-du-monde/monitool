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
			// FIXME: shouldn't this be the other way around? $eval(attr) || defaultValue
			var project = scope.masterProject || scope.$eval(attributes.aclProject),
				askedRole    = attributes.aclHasProjectRole || attributes.aclLacksProjectRole;

			if (askedRole !== 'owner' && askedRole !== 'input')
				throw new Error("acl-has-project-role must be called with either 'owner' or 'input'");

			if (askedRole === 'owner') {
				if (userCtx.type === 'user') {
					var internalUser = project.users.find(function(u) { return u.id == userCtx._id; });
					return userCtx.role === 'admin' || internalUser.role === 'owner';
				}

				else if (userCtx.type === 'partner')
					return userCtx.projectId === project._id && userCtx.role === 'owner';
				
				else
					throw new Error('Invalid userCtx.type value');
			}
			else if (askedRole === 'input') {
				if (userCtx.type === 'user') {
					var internalUser = project.users.find(function(u) { return u.id == userCtx._id; });
					return userCtx.role === 'admin' || ['owner', 'input', 'input_all'].indexOf(internalUser.role) !== -1;
				}

				else if (userCtx.type === 'partner')
					return userCtx.projectId === project._id && ['owner', 'input', 'input_all'].indexOf(userCtx.role) !== -1;

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

	.directive('aclHasInputForm', function($rootScope, _makeReadOnly, _isAllowedForm) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedForm(userCtx, scope, element, attributes);
					if (!isAllowed)
						_makeReadOnly(scope, element, attributes);
					
					unwatch();
				});
			}
		}
	})

	.directive('aclLacksInputForm', function($rootScope, _makeReadOnly, _isAllowedForm) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var isAllowed = _isAllowedForm(userCtx, scope, element, attributes);
					if (isAllowed)
						_makeReadOnly(scope, element, attributes);
					
					unwatch();
				});
			}
		}
	})


	.directive('aclHasAdministration', function($rootScope, _makeReadOnly) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type !== 'user' || userCtx.role !== 'admin')
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})

	.directive('aclLacksAdministration', function($rootScope, _makeReadOnly) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type === 'user' && userCtx.role === 'admin')
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})


	.directive('aclHasProjectCreation', function($rootScope, _makeReadOnly) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type !== 'user' || userCtx.role === 'common')
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})

	.directive('aclLacksProjectCreation', function($rootScope, _makeReadOnly) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					if (userCtx.type === 'user' && userCtx.role !== 'common')
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
