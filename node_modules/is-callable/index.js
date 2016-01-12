'use strict';

var constructorRegex = /\s*class /;
var isNonES6ClassFn = function isNonES6ClassFn(value) {
	try {
		return !constructorRegex.test(value);
	} catch (e) {
		return false; // not a function
	}
};

var fnToStr = Function.prototype.toString;
var tryFunctionObject = function tryFunctionObject(value) {
	try {
		if (constructorRegex.test(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isCallable(value) {
	if (!value) { return false; }
	if (typeof value !== 'function' && typeof value !== 'object') { return false; }
	if (hasToStringTag) { return tryFunctionObject(value); }
	if (!isNonES6ClassFn(value)) { return false; }
	var strClass = toStr.call(value);
	return strClass === fnClass || strClass === genClass;
};
