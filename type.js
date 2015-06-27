var u = require('util');
var Cached = require('./cache');

var TYPES = require('./config').types;

var Type = function (s){
	if(s && !TYPES[s])
		throw new Error(u.format('Unkown type "%s", must be one of %s', type.name, Type.TYPES))

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
