
Math.factorial = function(num) {
	var rval = 1;
	for (var i = 2; i <= num; i++)
		rval = rval * i;

	return rval;
};

Number.isNaN = Number.isNaN || function(value) {
 	return typeof value === "number" && isNaN(value);
};

