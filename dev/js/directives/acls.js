"use strict";

// acl-require-role
// acl-require-project-role
// acl-fallback

function _makeReadOnly(scope, element, attributes) {
	// replace by raw text
	if (attributes.aclFallback) {
		var fallback = scope.$eval(attributes.aclFallback);
		
		// handle boolean case.
		if (fallback === true)
			fallback = '<i class="fa fa-check" style="color: green"></i>'
		else if (fallback === false)
			fallback = '<i class="fa fa-times" style="color: red"></i>'

		if (element.parent().hasClass('form-group'))
			fallback = '<p class="form-control-static">' + fallback + '</p>';

		element.html(fallback);
	}
	else
		element.remove();
};

angular.module('monitool.directives.acl', [])
	.directive('aclRequireRole', function() {
		return {
			link: function(scope, element, attributes) {
				var isAllowed = scope.userCtx.roles.indexOf(attributes.aclRequireRole) !== -1;
				if (!isAllowed)
					_makeReadOnly(scope, element, attributes);
			}
		}
	})
	.directive('aclRequireProjectRole', function() {
		return {
			link: function(scope, element, attributes) {
				if (!scope.project._id)
					return scope.userCtx.roles.indexOf('project_create') !== -1;
				else {
					var isAllowed = scope.project.owners.indexOf(scope.userCtx.name) !== -1;
					if (!isAllowed)
						_makeReadOnly(scope, element, attributes);
				}
			}
		}
	});
