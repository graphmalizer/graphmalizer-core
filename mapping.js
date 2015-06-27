var u = require('util');

var Dataset = require('./dataset');
var Type = require('./type');
var log = require('./log');

// create hash from a bunch of things
var crypto = require('crypto');

var hashOf = function(things){
	var shasum = crypto.createHash('sha224');
	things.forEach(function(x){
		shasum.update(x);
	});
	return shasum.digest('base64');
}

module.exports = function(dname, tname, id, source, target, doc)
{	
	var dataset = Dataset.cget(dname);
	var type = Type.cget(tname);

	log.DATASET(dataset);
	log.TYPE(type);

	// nodes must have an id!
	if ((type.isNode) && (!id))
			throw new Error(u.format('Must specify id when creating a node!'));

	// we are dealing with an edge
	if(type.isEdge)
	{
		if(!source)
			throw new Error(u.format("Missing source"));

		if(!target)
			throw new Error(u.format("Missing target"));

		// if no id is specified, build one
		var eid = id || hashOf([
			source.replace('/', '.'),
			type.name,
			target.replace('/', '.')
		]);
	}

	return {
		params: {
			dataset: dname,
			type: tname,
			id: id || eid,
			source: source,
			target: target,
			doc: doc
		},
		isNode: type.isNode,
		isEdge: type.isEdge
	}	
}