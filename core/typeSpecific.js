var R = require('ramda');
var types = require('./config').types;

// create hash from a bunch of things
var crypto = require('crypto');
var hashOf = function(things){
	var shasum = crypto.createHash('sha224');
	things.forEach(function(x){
		shasum.update(x);
	});
	return shasum.digest('base64');
}

// we define how identifiers are created for each structure here
var defaultOptions = {
	node: {
		identifier: function(input){
			if(!input.id)
				throw new Error(u.format("Type '%s' requires an id", input.type));

			return input.id;
		}
	},
	edge: {
		identifier: function(input){
			if(!input.id && (!input.source || !input.target || !input.type))
				throw new Error(u.format("Type '%s' requires id or source, target", input.type));

			return input.id || hashOf([input.source,input.type,input.target]);
		}
	}
}

// map over all types
module.exports = R.mapObjIndexed(
	function(opts, structure){
		// find what sort of structure
		var s = Object.keys(opts)[0];
		// configuration overrides these defaults
		return R.merge(defaultOptions[s] || {}, opts[s]);
	}, types
);