var R = require('ramda');
var u = require('util');

var Cached = require('../utils/cache');
var TYPES = require('../utils/config').types;

// we are screaming here, because it is really important
var STRUCTURES = require('./graph').structures;
var TYPE_SPECIFIC = require('./typeSpecific');

var Type = function (s)
{
	if(!s)
		throw new Error("You must specify a type");

	if(s && !TYPES[s])
		throw new Error(u.format('Unkown type "%s", must be one of %s',
			s, Object.keys(TYPES).join(', ')));

	// store the name
	this.name = s;
	
	// TODO move to config?
	this.opts = TYPE_SPECIFIC[s];

	// what kind of structure is it: node, arc, ..
	var k = Object.keys(TYPES[s])[0]

	if(!STRUCTURES[k])
		throw new Error(u.format('Unknown structure "%s", must be one of %s',
			k, Object.keys(STRUCTURES).join(', ')));

	// store it
	this.structure = k
}

Type.prototype.identifier = function(input) {
	if(this.opts.identifier)
		return this.opts.identifier(input);

	return input.id;
}

module.exports = Cached(Type);
