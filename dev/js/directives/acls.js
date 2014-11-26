"use strict";

// acl-require-role
// acl-require-project-role
// acl-fallback


angular.module('monitool.directives.acl', [])
	.directive('aclRequireRole', function() {
		return {
			link: function(scope, element, attributes) {
				scope.$watch('userCtx', function() {
					// we just refreshed, user is not loaded...
					if (!scope.userCtx)
						;
					
					// user is allowed
					else if (scope.userCtx.roles.indexOf(attributes.aclRequireRole) !== -1)
						;

					// replace by raw text
					else if (attributes.aclFallback) {
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
				});
			}
		}
	})
	.directive('aclRequireProjectRole', function() {
		return {
			link: function(scope, element, attributes) {
				scope.$watch('userCtx', function() {
					// we just refreshed, user is not loaded...
					if (!scope.userCtx)
						;

					// // user is allowed
					// else if (scope.userCtx.roles.indexOf(attributes.aclRequireRole) !== -1)
					// 	;

					// replace by raw text
					else if (attributes.aclFallback) {
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
				});
			}
		}
	});
