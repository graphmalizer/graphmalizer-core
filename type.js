var Cached = require('./cache');

var TYPES = require('./conf/typedefs');

var Type = function (s){
	this.name = s || '*';
	
	this.isNode = (TYPES[s] && TYPES[s].node && true) || false
	this.isEdge = (TYPES[s] && TYPES[s].edge && true) || false
	this.opts = {}
	
	if(this.isNode)
		this.opts = TYPES[s].node;

	if(this.isEdge)
		this.opts = TYPES[s].edge;
}

module.exports = Cached(Type);