
/**
 * Compute of the n-th permutation of sequence range(i)
 */
export function computeNthPermutation(n, i) {
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
