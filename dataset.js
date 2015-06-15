var R = require('ramda');
var Cached = require('./cache');

var Dataset = function (s){
	this.name = s || '*';
	this.path = this.name.split('.');
	this.root = R.head(this.path);
};

Dataset.prototype.normalizeId = function(id){
	// do nothing if we find a `/`
	if(/\//.test(id))
		return id;
	
	// expand
	return this.root + '/' + id;
}

module.exports = Cached(Dataset);