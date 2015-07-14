var Cached = require('../utils/cache');

var Dataset = function (s){
	this.name = s || '*';
};

module.exports = Cached(Dataset);