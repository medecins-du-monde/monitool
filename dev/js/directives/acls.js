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
		
		// handle boolean case.
		if (fallback === true)
			fallback = '<i class="fa fa-check" style="color: green"></i>';
		else if (fallback === false)
			fallback = '<i class="fa fa-times" style="color: red"></i>';

		// handle dates
		if (Object.prototype.toString.call(fallback) === '[object Date]')
			fallback = moment(fallback).format('YYYY-MM-DD');

		if (element.parent().hasClass('form-group'))
			fallback = '<p class="form-control-static">' + fallback + '</p>';

		element.html(fallback.toString());
	}
	else
		element.remove();
};

angular.module('monitool.directives.acl', [])
	.directive('aclHasRole', function() {
		return {
			link: function(scope, element, attributes) {
				var roles = scope.userCtx.roles || [],
					isAllowed = roles.indexOf(attributes.aclHasRole) !== -1 || roles.indexOf('_admin') !== -1;

				if (!isAllowed)
					_makeReadOnly(scope, element, attributes);
			}
		}
	})
	.directive('aclHasProjectRole', function() {
		return {
			link: function(scope, element, attributes) {
				var roles = scope.userCtx.roles || [],
					project = scope.$eval(attributes.project) || scope.project,
					owners;

				if (attributes.aclHasProjectRole === 'owner')
					owners = project.owners || [];
				else if (attributes.aclHasProjectRole === 'input')
					owners = project.dataEntryOperators || [];
				else
					throw new Error("acl-has-project-role must be called with either 'owner' or 'input'");

				if (!project._id)
					return roles.indexOf('project_create') !== -1 || roles.indexOf('_admin') !== -1;
				else {
					var isAllowed = owners.indexOf(scope.userCtx.name) !== -1 || roles.indexOf('_admin') !== -1;
					if (!isAllowed)
						_makeReadOnly(scope, element, attributes);
				}
			}
		}
	})
	.directive('aclLacksRole', function() {
		return {
			link: function(scope, element, attributes) {
				var roles = scope.userCtx.roles || [],
					isForbidden = roles.indexOf(attributes.aclLacksRole) === -1 && roles.indexOf('_admin') === -1;

				if (!isForbidden)
					_makeReadOnly(scope, element, attributes);
			}
		}
	})
	.directive('aclLacksProjectRole', function() {
		return {
			link: function(scope, element, attributes) {
				var roles = scope.userCtx.roles || [],
					project = scope.$eval(attributes.project) || scope.project,
					owners;
				if (attributes.aclLacksProjectRole === 'owner')
					owners = scope.project.owners || [];
				else if (attributes.aclLacksProjectRole === 'input')
					owners = scope.project.dataEntryOperators || [];
				else
					throw new Error("acl-lacks-project-role must be called with either 'owner' or 'input'");

				if (!scope.project._id)
					return roles.indexOf('project_create') === -1 && roles.indexOf('_admin') === -1;
				else {
					var isForbidden = owners.indexOf(scope.userCtx.name) === -1 && roles.indexOf('_admin') === -1;
					if (!isForbidden)
						_makeReadOnly(scope, element, attributes);
				}
			}
		}
	});
