"use strict";

angular.module('monitool.directives.projectLogframe', [])
	
	.directive('printLogframe', function() {
		return {
			restrict: "AE",
			templateUrl: 'partials/projects/specification/logframe-print.html',
			scope: true,
			link: function($scope, element) {
				var name = function(indicatorId) {
					return $scope.indicatorsById[indicatorId].name;
				};

				var source = function(indicatorId) {
					return $scope.project.indicators[indicatorId].source;
				};

				$scope.$watch('project.logicalFrame', function(logFrame) {
					var indicators = $scope.project;

					$scope.rows = [[
						{content: ""},
						{content: "Intervention logic"},
						{content: "Assumptions"},
						{content: "Objectively verifiable indicators of achievement"},
						{content: "Sources and means of verification"},
					]];

					if (logFrame.indicators.length) {
						$scope.rows.push([
							{content: "Overall objectives", rowspan: logFrame.indicators.length},
							{content: logFrame.goal, rowspan: logFrame.indicators.length},
							{content: "", rowspan: logFrame.indicators.length},
							{content: name(logFrame.indicators[0])},
							{content: source(logFrame.indicators[0])},
						]);

						logFrame.indicators.slice(1).forEach(function(indicatorId) {
							$scope.rows.push([
								{content: name(indicatorId)},
								{content: source(indicatorId)},
							]);
						});
					}
					else
						$scope.rows.push([
							{content: "Overall objectives"},
							{content: logFrame.goal},
							{content: ""},
							{content: ""},
							{content: ""}
						]);

					var rowspan = 0, isFirst = true;
					logFrame.purposes.forEach(function(purpose) {
						rowspan += purpose.indicators.length || 1;
					});

					logFrame.purposes.forEach(function(purpose) {
						if (purpose.indicators.length) {
							var firstLine = [
								{content: purpose.description, rowspan: purpose.indicators.length},
								{content: purpose.assumptions, rowspan: purpose.indicators.length},
								{content: name(purpose.indicators[0])},
								{content: source(purpose.indicators[0])},
							];

							if (isFirst) {
								isFirst = false;
								firstLine.unshift({content: "Specific objectives", rowspan: rowspan});
							}

							$scope.rows.push(firstLine);

							purpose.indicators.slice(1).forEach(function(indicatorId) {
								$scope.rows.push([
									{content: name(indicatorId)},
									{content: source(indicatorId)}
								]);
							});
						}
						else {
							var firstLine = [
								{content: purpose.description},
								{content: purpose.assumptions},
								{content: ""},
								{content: ""},
							];

							if (isFirst) {
								isFirst = false;
								firstLine.unshift({content: "Specific objectives", rowspan: rowspan});
							}

							$scope.rows.push(firstLine);
						}
					});
					
					rowspan = 0;
					isFirst = true;
					logFrame.purposes.forEach(function(purpose) {
						purpose.outputs.forEach(function(output) {
							rowspan += output.indicators.length || 1;
						});
					});

					logFrame.purposes.forEach(function(purpose) {
						purpose.outputs.forEach(function(output) {
							if (output.indicators.length) {
								var firstLine = [
									{content: output.description, rowspan: output.indicators.length},
									{content: output.assumptions, rowspan: output.indicators.length},
									{content: name(output.indicators[0])},
									{content: source(output.indicators[0])},
								];

								if (isFirst) {
									isFirst = false;
									firstLine.unshift({content: "Results", rowspan: rowspan});
								}

								$scope.rows.push(firstLine);

								output.indicators.slice(1).forEach(function(indicatorId) {
									$scope.rows.push([
										{content: name(indicatorId)},
										{content: source(indicatorId)}
									]);
								});
							}
							else {
								var firstLine = [
									{content: output.description},
									{content: output.assumptions},
									{content: ""},
									{content: ""},
								];

								if (isFirst) {
									isFirst = false;
									firstLine.unshift({content: "Results", rowspan: rowspan});
								}

								$scope.rows.push(firstLine);
							}
						});
					});

					
					rowspan = 0;
					isFirst = true;
					logFrame.purposes.forEach(function(purpose) {
						purpose.outputs.forEach(function(output) {
							rowspan += output.activities.length;
						});
					});
					
					logFrame.purposes.forEach(function(purpose) {
						purpose.outputs.forEach(function(output) {
							output.activities.forEach(function(activity) {
								var firstLine = [
									{content: activity.description, colspan: 4}
								];

								if (isFirst) {
									isFirst = false;
									firstLine.unshift({content: "Activities", rowspan: rowspan});
								}

								$scope.rows.push(firstLine);
							});
						});
					});
				}, true);
			}
		}
	});
