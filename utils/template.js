// simple cached templating

var cache = {};

function lookup(s) {
	return cache[s] || (cache[s] = new RegExp('«' + s + '»', 'g'));
}

module.exports = function(s, obj){
	return Object.keys(obj).reduce(function(x, key) {
		// replace {x:123}, 'hi, «x»' -> 'hi, 123'
		return x.replace(lookup(key), obj[key]);
	}, s);
};
