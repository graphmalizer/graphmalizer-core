var R = require('ramda');
var Cached = require('./cache');

var Dataset = function (s){
	this.name = s || '*';
	this.path = this.name.split('-');
	this.root = R.head(this.path);
};

module.exports = Cached(Dataset);