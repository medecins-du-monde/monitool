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

	.filter('logFrameReport', function() {

		var getAssignedIndicatorIds = function(project) {
			var result = [];
			result = project.logicalFrame.indicators.concat(result);
			
			project.logicalFrame.purposes.forEach(function(purpose) {
				result = purpose.indicators.concat(result);
				purpose.outputs.forEach(function(output) {
					result = output.indicators.concat(result);
				});
			});
			
			return result;
		};

		var getUnassignedIndicatorIds = function(project) {
			var otherIndicators = Object.keys(project.indicators);
			
			getAssignedIndicatorIds(project).forEach(function(indicatorId) {
				if (otherIndicators.indexOf(indicatorId) !== -1)
					otherIndicators.splice(otherIndicators.indexOf(indicatorId), 1);
			});

			return otherIndicators;
		};

		var getStats = function(indent, stats, indicatorId) {
			var stat = stats.rows.find(function(row) { return row.id === indicatorId; });
			if (stat) {
				stat = angular.copy(stat);
				stat.type = 'data';
				stat.indent = indent;
			}
			return stat;
		};

		var lastResult = null, lastStats = null;

		return function(stats, project) {
			if (!stats)
				return null;

			if (angular.equals(lastStats, stats))
				return lastResult;

			var logFrameReport = [];

			logFrameReport.push({type: 'header', text: project.logicalFrame.goal, indent: 0});
			Array.prototype.push.apply(logFrameReport, project.logicalFrame.indicators.map(getStats.bind(null, 0, stats)));
			project.logicalFrame.purposes.forEach(function(purpose) {
				logFrameReport.push({type: 'header', text: purpose.description, indent: 1});
				Array.prototype.push.apply(logFrameReport, purpose.indicators.map(getStats.bind(null, 1, stats)));
				purpose.outputs.forEach(function(output) {
					logFrameReport.push({type: 'header', text: output.description, indent: 2});
					Array.prototype.push.apply(logFrameReport, output.indicators.map(getStats.bind(null, 2, stats)));
				});
			});
			Array.prototype.push.apply(logFrameReport, getUnassignedIndicatorIds(project).map(getStats.bind(null, 0, stats)));

			if (!angular.equals(logFrameReport, lastResult)) {
				lastResult = logFrameReport;
				lastStats = stats;
			}

			return lastResult;
		}
	})
	

