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


/*	Ensure string arguments are converted into normal form

	dataset ~> Dataset
	type ~> Type
*/
var normalize = function(f) {
	return function(d, ty, id, source, target, doc)
	{
		var dataset = Dataset.cget(d);
		var type = Type.cget(ty);

		log.DATASET(dataset);
		log.TYPE(type);

		// nodes must have an id!
		if(type.isNode){

			if(!id)
				throw new Error(u.format('Must specify id when creating a node!'));
		
			return f(dataset, type, id, undefined, undefined, doc);
		}

		// we are dealing with an edge
		if(type.isEdge){

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

			return f(dataset, type, eid, source, target, doc);
		}
	} 
}

module.exports = normalize(
	function(dataset, type, id, source_id, target_id, doc) {

		var base = {
			params: {
				labels: [
					'T_' + type.name, // double function: ES type, Node Type
					'I_' + dataset.name, // subdataset owning this element
					'__' // meaning, this is a managed node
				],
				id: id,
				doc: doc
			},
			isNode: true,
			isEdge: false
		};

		// add edge info
		if(type.isEdge) {
			base.isNode = false;
			base.isEdge = true;
			base.params.source = source_id;
			base.params.target = target_id;
		}
		
		return base;
	}	
);