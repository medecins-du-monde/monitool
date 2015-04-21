// https://gist.github.com/darlanalves/5b0865b7e3c8e3b00b67

angular.module('monitool.filters', [])
	.filter('join', function() {
		return function(list, token) {
			return (list||[]).join(token);
		}
	})
	.filter('pluck', function() {
		function pluck(objects, property) {
			if (!(objects && property && angular.isArray(objects)))
				return [];
 
			property = String(property);
			
			return objects.map(function(object) {
				// just in case
				object = Object(object);
				
				if (object.hasOwnProperty(property)) {
					return object[property];
				}
				
				return '';
			});
		}
		
		return function(objects, property) {
			return pluck(objects, property);
		}
	})

	.filter('getObjects', function() {
		return function(ids, objects) {
			objects = objects || {};
			ids = ids || [];

			var objectsById = {};
			for (var key in objects) {
				var obj = objects[key];
				objectsById[obj.id || obj._id] = obj;
			}

			return ids.map(function(id) { return objectsById[id]; });
		}
	})



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
