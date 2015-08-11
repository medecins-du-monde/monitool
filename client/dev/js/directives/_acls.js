"use strict";

// acl-has-role
// acl-has-project-role
// acl-lacks-role
// acl-lacks-project-role
// acl-fallback

function _makeReadOnly(scope, element, attributes) {
	// replace by raw text
	if (attributes.aclFallback) {
		var fallback = scope.$eval(attributes.aclFallback) || '';

		// handle boolean and dates case.
		if (fallback === true)
			fallback = '<i class="fa fa-check" style="color: green"></i>';
		
		else if (fallback === false)
			fallback = '<i class="fa fa-times" style="color: red"></i>';
		
		else if (Object.prototype.toString.call(fallback) === '[object Date]')
			fallback = moment(fallback).format('YYYY-MM-DD');

		// Nest in a form-control-static if needed.
		if (element.parent().hasClass('form-group'))
			fallback = '<p class="form-control-static">' + fallback + '</p>';

		element.html(fallback.toString());
	}
	else {
		element.remove();
	}
};

angular.module('monitool.directives.acl', [])
	.directive('aclHasRole', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var roles = userCtx.roles || [],
						isAllowed = roles.indexOf(attributes.aclHasRole) !== -1 || roles.indexOf('_admin') !== -1;

					if (!isAllowed)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})
	.directive('aclHasProjectRole', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var roles = userCtx.roles || [],
						project = scope.$eval(attributes.project) || scope.project,
						owners;

					if (attributes.aclHasProjectRole === 'owner')
						owners = project.owners || [];
					else if (attributes.aclHasProjectRole === 'input')
						owners = project.dataEntryOperators || [];
					else
						throw new Error("acl-has-project-role must be called with either 'owner' or 'input'");

					var isAllowed = owners.indexOf(userCtx._id) !== -1 || roles.indexOf('_admin') !== -1;
					if (!isAllowed)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})
	.directive('aclLacksRole', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var roles = userCtx.roles || [],
						isForbidden = roles.indexOf(attributes.aclLacksRole) === -1 && roles.indexOf('_admin') === -1;

					if (!isForbidden)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	})
	.directive('aclLacksProjectRole', function($rootScope) {
		return {
			link: function(scope, element, attributes) {
				var unwatch = $rootScope.$watch('userCtx', function(userCtx) {
					if (!userCtx)
						return;

					var roles = userCtx.roles || [],
						project = scope.$eval(attributes.project) || scope.project,
						owners;

					if (attributes.aclLacksProjectRole === 'owner')
						owners = scope.project.owners || [];
					else if (attributes.aclLacksProjectRole === 'input')
						owners = scope.project.dataEntryOperators || [];
					else
						throw new Error("acl-lacks-project-role must be called with either 'owner' or 'input'");

					var isForbidden = owners.indexOf(userCtx._id) === -1 && roles.indexOf('_admin') === -1;
					if (!isForbidden)
						_makeReadOnly(scope, element, attributes);

					unwatch();
				});
			}
		}
	});
