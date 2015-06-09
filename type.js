var Cached = require('./cache');

var TYPES = require('./conf/typedefs');

var Type = function (s){
	this.name = s;
	this.isNode = (TYPES[s].node && true) || false
	this.isEdge = (TYPES[s].edge && true) || false
	this.opts = TYPES[s][this.isNode ? 'node' : 'edge']
}

module.exports = Cached(Type);