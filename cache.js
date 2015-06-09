// super minimal cache

module.exports = function Cache(C){
	C._cache = {}
	C.cget = function(x) {
		return C._cache[x] || (C._cache[x] = new C(x));
	}
	return C;
}