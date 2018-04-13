
// Most polyfills just come from MDN.
// I'm not sure about the licence, but everything should be MIT or alike.

if (!Array.prototype.pluck)
	Array.prototype.pluck = function(col) {
		if (this == null)
			throw new TypeError('Array.prototype.pluck called on null or undefined');

		if (typeof col !== 'string')
			throw new TypeError('col must be a string');

		return this.map(function(item) {
			return item[col];
		});
	}


if (!Array.prototype.findIndex)
	Array.prototype.findIndex = function(predicate) {
		if (this == null)
			throw new TypeError('Array.prototype.find called on null or undefined');

		if (typeof predicate !== 'function')
			throw new TypeError('predicate must be a function');

		var list = Object(this);
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		var value;

		for (var i = 0; i < length; i++) {
			value = list[i];
			if (predicate.call(thisArg, value, i, list))
				return i;
		}

		return -1;
	};


if (!Array.prototype.find)
	Array.prototype.find = function(predicate) {
		var index = this.findIndex(predicate);
		return index !== -1 ? this[index] : undefined;
	};


// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
if (!Array.prototype.reduce)
	Array.prototype.reduce = function(callback) {
		'use strict';

		if (this == null)
			throw new TypeError('Array.prototype.reduce called on null or undefined');

		if (typeof callback !== 'function')
			throw new TypeError(callback + ' is not a function');

		var t = Object(this), len = t.length >>> 0, k = 0, value;

		if (arguments.length == 2)
			value = arguments[1];
		else {
			while (k < len && ! k in t)
				k++;

			if (k >= len)
				throw new TypeError('Reduce of empty array with no initial value');

			value = t[k++];
		}

		for (; k < len; k++)
			if (k in t)
				value = callback(value, t[k], k, t);

		return value;
	};


if (!Array.prototype.every)
	Array.prototype.every = function(callbackfn, thisArg) {
		'use strict';
		var T, k;

		if (this == null)
			throw new TypeError('this is null or not defined');


		// 1. Let O be the result of calling ToObject passing the this
		//    value as the argument.
		var O = Object(this);

		// 2. Let lenValue be the result of calling the Get internal method
		//    of O with the argument "length".
		// 3. Let len be ToUint32(lenValue).
		var len = O.length >>> 0;

		// 4. If IsCallable(callbackfn) is false, throw a TypeError exception.
		if (typeof callbackfn !== 'function') {
			throw new TypeError();
		}

		// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
		if (arguments.length > 1) {
			T = thisArg;
		}

		// 6. Let k be 0.
		k = 0;

		// 7. Repeat, while k < len
		while (k < len) {

			var kValue;

			// a. Let Pk be ToString(k).
			//   This is implicit for LHS operands of the in operator
			// b. Let kPresent be the result of calling the HasProperty internal
			//    method of O with argument Pk.
			//   This step can be combined with c
			// c. If kPresent is true, then
			if (k in O) {

				// i. Let kValue be the result of calling the Get internal method
				//    of O with argument Pk.
				kValue = O[k];

				// ii. Let testResult be the result of calling the Call internal method
				//     of callbackfn with T as the this value and argument list
				//     containing kValue, k, and O.
				var testResult = callbackfn.call(T, kValue, k, O);

				// iii. If ToBoolean(testResult) is false, return false.
				if (!testResult) {
					return false;
				}
			}
			k++;
		}
		return true;
	};



//  Added by stlsmiths 6/13/2011
//  re-define Array.indexOf, because IE doesn't know it ...
//
//  from http://stellapower.net/content/javascript-support-and-arrayindexof-ie
if (!Array.indexOf)
	Array.prototype.indexOf = function (obj, start) {
		for (var i = (start || 0); i < this.length; i++)
			if (this[i] === obj)
				return i;

		return -1;
	}
