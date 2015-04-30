"use strict";

angular.module('monitool.filters.indicator', [])

	.filter('hierarchyFilter', function(mtRemoveDiacritics, $rootScope) {
		var lastHierarchy = null, lastSearchField = null;
		var lastResult;

		var compare = function(i1, i2) {
			if (i1.name && !i2.name)
				return 1;
			else if (!i1.name && i2.name)
				return -1;
			else if (!i1.name && !i2.name)
				return 0;
			else
				return i1.name[$rootScope.language].localeCompare(i2.name[$rootScope.language]);
		};

		// FIXME i have yet to understand why this piece of code works.
		return function(hierarchy, searchField) {
			if (searchField.length < 3)
				searchField = '';

			if (searchField === lastSearchField && angular.equals(lastHierarchy, hierarchy))
				return lastResult;

			var filter = mtRemoveDiacritics(searchField).toLowerCase().split(/\s+/),
				numWords = filter.length,
				result = angular.copy(hierarchy);

			if (searchField.length >= 3)
				result = result.filter(function(theme) {
					theme.open = true;
					theme.children = theme.children.filter(function(type) {
						type.open = true;
						type.children = type.children.filter(function(indicator) {
							var name = mtRemoveDiacritics(indicator.name[$rootScope.language]).toLowerCase();
							var matches = 0;
							for (var i = 0; i < numWords; ++i)
								if (name.indexOf(filter[i]) !== -1)
									matches++;
							return matches == numWords;
						});

						return type.children.length;
					});

					return theme.children.length;
				});

			// sort by alpha order
			result.sort(compare);
			result.forEach(function(theme) {
				theme.children.sort(compare);
				theme.children.forEach(function(type) {
					type.children.sort(compare);
				});
			});

			lastHierarchy = hierarchy;
			lastSearchField = searchField;
			lastResult = result;

			return result;
		}
	});
