"use strict";

var indicatorControllers = angular.module('monitool.controllers.indicator', []);

indicatorControllers.controller('IndicatorListController', function($scope, indicatorHierarchy, typesById, themesById) {
	$scope.hierarchy  = indicatorHierarchy;
	$scope.types      = typesById;
	$scope.themes     = themesById;
	$scope.orderField = 'name';
});


indicatorControllers.controller('IndicatorEditController', function($state, $scope, $stateParams, mtDatabase, mtFormula, indicator, indicators, types, themes) {
	// Formula handlers
	$scope.addFormula = function() {
		var uuid  = PouchDB.utils.uuid().toLowerCase(),
			value = {name: '', expression: '', parameters: {}};

		$scope.indicator.formulas[uuid] = value;
	};

	$scope.deleteFormula = function(formulaId) {
		delete $scope.indicator.formulas[formulaId];
	};

	$scope.annotateFormula = function(formulaId) {
		mtFormula.annotate($scope.indicator.formulas[formulaId]);
	};

	// Form actions
	$scope.reset = function() {
		$scope.indicator = angular.copy($scope.master);
	};

	$scope.save = function() {
		if ($stateParams.indicatorId === 'new')
			$scope.indicator._id = PouchDB.utils.uuid().toLowerCase();

		mtDatabase.current.put($scope.indicator).then(function(result) {
			$scope.indicator._rev = result.rev;
			$scope.master = angular.copy($scope.indicator);

			if ($stateParams.indicatorId === 'new')
				$state.go('main.indicator.edit', {indicatorId: result.id});
		});
	};

	$scope.formulaInvalid = function() {
		return Object.keys($scope.indicator.formulas).some(function(formulaId) {
			return !$scope.indicator.formulas[formulaId].isValid;
		});
	};

	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.indicator);
	};

	$scope.remove = function() {
		console.log($scope.indicator);
	};

	// init scope
	$scope.indicator  = indicator;
	for (var formulaId in indicator.formulas)
		$scope.annotateFormula(formulaId);

	$scope.master     = angular.copy(indicator);
	$scope.indicators = indicators.filter(function(i) { return i._id != indicator._id });
	$scope.types      = types;
	$scope.themes     = themes;
});


indicatorControllers.controller('IndicatorReportingController', function($scope, mtReporting, indicator, projects) {
	var chart = c3.generate({bindto: '#chart', data: {x: 'x', columns: []}, axis: {x: {type: "category"}}});

	$scope.indicator = indicator;
	$scope.projects = projects;

	$scope.begin   = moment().subtract(1, 'year').format('YYYY-MM');
	$scope.end     = moment().format('YYYY-MM');
	$scope.groupBy = 'month';
	$scope.display = 'value';
	$scope.plots   = {};

	if ($scope.end > moment().format('YYYY-MM'))
		$scope.end = moment().format('YYYY-MM');

	var getName = function(entityId) {
		var numProjects = $scope.projects.length;
		for (var i = 0; i < numProjects; ++i) {
			if ($scope.projects[i]._id == entityId)
				return $scope.projects[i].name;

			var numEntities = $scope.projects[i].inputEntities.length;
			for (var j = 0; j < numEntities; ++j)
				if ($scope.projects[i].inputEntities[j].id === entityId)
					return $scope.projects[i].inputEntities[j].name;
		}
	};

	// Retrieve inputs
	$scope.updateData = function() {
		$scope.cols = mtReporting.getStatsColumns(null, $scope.begin, $scope.end, $scope.groupBy, null, null);

		mtReporting.getIndicatorStats($scope.indicator, $scope.projects, $scope.begin, $scope.end, $scope.groupBy).then(function(data) {
			$scope.data = data;
			if ($scope.plot)
				$scope.updateGraph();
		});
	};

	$scope.updateGraph = function(changedEntityId) {
		var cols      = $scope.cols.filter(function(e) { return e.id != 'total' }).map(function(e) { return e.name; }),
			chartData = {type: 'line', columns: [['x'].concat(cols)]};

		if (changedEntityId && !$scope.plots[changedEntityId])
			chartData.unload = [getName(changedEntityId)];

		for (var entityId in $scope.plots) {
			if ($scope.plots[entityId]) {
				// Retrieve name
				var column = [getName(entityId)];

				// iterate on months, centers, etc
				$scope.cols.forEach(function(col) {
					if (col.id !== 'total') {
						if ($scope.data[col.id] && $scope.data[col.id][entityId] && $scope.data[col.id][entityId][indicator._id])
							column.push($scope.data[col.id][entityId][indicator._id][$scope.display] || 0);
						else
							column.push(0);
					}
				});

				chartData.columns.push(column);
			}
		}

		chart.load(chartData);
	};

	$scope.downloadCSV = function() {
		var csvDump = mtReporting.exportIndicatorStats($scope.cols, $scope.projects, indicator, $scope.data),
			blob    = new Blob([csvDump], {type: "text/csv;charset=utf-8"}),
			name    = [indicator.name, $scope.begin, $scope.end].join('_') + '.csv';

		saveAs(blob, name);
	};

	$scope.downloadGraph = function() {
		var filename  = [indicator.name, $scope.begin, $scope.end].join('_') + '.png',
			sourceSVG = document.querySelector("svg");
		
		saveSvgAsPng(sourceSVG, filename, 1);
	};

	$scope.updateData();
});

indicatorControllers.controller('ThemeTypeListController', function($scope, $state, entities, mtDatabase) {
	entities.sort(function(entity1, entity2) {
		return entity1.name.localeCompare(entity2.name);
	});

	$scope.entities = entities;
	$scope.master = angular.copy(entities);
	$scope.entityType = $state.current.data.entityType;

	$scope.hasChanged = function(entityIndex) {
		return !angular.equals($scope.entities[entityIndex], $scope.master[entityIndex]);
	};

	$scope.create = function() {
		var newEntity = {_id: PouchDB.utils.uuid().toLowerCase(), type: $state.current.data.entityType, name: ''};
		$scope.entities.push(newEntity);
		$scope.master.push(angular.copy(newEntity));
	};

	$scope.save = function(entityIndex) {
		var entity = $scope.entities[entityIndex];
		$scope.master[entityIndex] = angular.copy(entity);

		if (entity.usage === undefined)
			mtDatabase.current.put(entity);
		else
			mtDatabase.current.get(entity._id).then(function(dbEntity) {
				dbEntity.name = entity.name;
				mtDatabase.current.put(dbEntity);
			});
	};

	$scope.remove = function(entityIndex) {
		var entity = $scope.entities.splice(entityIndex, 1)[0];
		$scope.master.splice(entityIndex, 1);

		// get and delete, because we need to know the revision, which is missing from the entity_short view.
		if (entity.usage !== undefined) // @FIXME, this is wrong! use another hash to know which entities are persisted
			mtDatabase.current.get(entity._id).then(function(entity) {
				mtDatabase.current.remove(entity);
			});
	};
});
