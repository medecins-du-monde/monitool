module.exports = {};

/**
 * Compute of the n-th permutation of sequence range(i)
 */
module.exports.computeNthPermutation = function(n, i) {
	var j, k = 0,
		fact = [],
		perm = [];

	// compute factorial numbers
	fact[k] = 1;
	while (++k < n)
		fact[k] = fact[k - 1] * k;

	// compute factorial code
	for (k = 0; k < n; ++k) {
		perm[k] = i / fact[n - 1 - k] << 0;
		i = i % fact[n - 1 - k];
	}

	// readjust values to obtain the permutation
	// start from the end and check if preceding values are lower
	for (k = n - 1; k > 0; --k)
		for (j = k - 1; j >= 0; --j)
			if (perm[j] <= perm[k])
				perm[k]++;

	return perm;
};

module.exports.transpose2D = function(rows) {
	if (rows.length === 0)
		return [];

	var result = new Array(rows[0].length);

	for (var x = 0; x < rows[0].length; ++x) {
		result[x] = new Array(rows.length);

		for (var y = 0; y < rows.length; ++y) {
			result[x][y] = JSON.parse(JSON.stringify(rows[y][x]));

			if (result[x][y].colSpan) {
				result[x][y].rowSpan = result[x][y].colSpan;
				delete result[x][y].colSpan;
			}
			else if (result[x][y].rowSpan) {
				result[x][y].colSpan = result[x][y].rowSpan;
				delete result[x][y].rowSpan;
			}
		}
	}

	return result;
};
