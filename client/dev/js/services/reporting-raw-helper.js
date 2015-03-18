


reportingServices.factory('mtRaw', function() {

	var sum = function(hash) {
		if (typeof hash === 'number')
			return hash;
		
		var result = 0;
		for (var key in hash)
			result += sum(hash[key])
		return result;
	};

	var makeSorted = function(inputs) {
		var sorted = {};
		
		inputs.forEach(function(input) {
			sorted[moment(input.period).format('YYYY-MM-DD')] = input.values;
		});

		return sorted;			
	};

	var makeCols = function(inputs) {
		var cols = {};
		inputs.forEach(function(input) {
			cols[moment(input.period).format('YYYY-MM-DD')] = true;
		});
		return Object.keys(cols).sort();
	};

	return function(form, inputs, entityId) {
		var filteredInputs = inputs.filter(function(input) { return input.entity === entityId; });

		var cols   = makeCols(filteredInputs),
			sorted = makeSorted(filteredInputs),
			rows   = [];

		form.rawData.forEach(function(section) {
			rows.push({ id: section.id, type: "header", name: section.name });

			section.elements.forEach(function(variable) {

				var subRow = {
					id: variable.id,
					name: variable.name,
					indent: 0,
					cols: cols.map(function(col) {
						var raw = sorted[col] ? sorted[col][variable.id] : undefined;
						return raw === undefined ? null : sum(raw);
					})
				}

				rows.push(subRow);

				variable.partition1.forEach(function(p1) {
					var id = makeUUID()
					subRow.hasChildren = true;
					var subSubRow = {
						id: id,
						parentId: variable.id,
						name: p1.name,
						indent: 1,
						cols: cols.map(function(col) {
							var raw = sorted[col] !== undefined && sorted[col][variable.id] !== undefined ? sorted[col][variable.id][p1.id] : undefined;
							return raw === undefined ? null : sum(raw);
						})
					}

					rows.push(subSubRow);

					variable.partition2.forEach(function(p2) {
						subSubRow.hasChildren = true;
						rows.push({
							id: makeUUID(),
							parentId: id,
							name: p2.name,
							indent: 2,
							cols: cols.map(function(col) {
								var raw = sorted[col] !== undefined && sorted[col][variable.id] !== undefined && sorted[col][variable.id][p1.id] !== undefined ? sorted[col][variable.id][p1.id][p2.id] : undefined;
								return raw === undefined ? null : sum(raw);
							})
						});
					});
				});
			});
		});
		return { cols: cols, rows: rows };
	}
});
