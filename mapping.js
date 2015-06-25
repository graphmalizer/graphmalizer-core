var u = require('util');
var c = require('chalk');
var R = require('ramda');
var pp = require('prttty');

var Dataset = require('./dataset');
var Type = require('./type');


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
	return function(d, ty, id, ps, pt, doc)
	{
		var dataset = Dataset.cget(d);
		var type = Type.cget(ty);

		console.log(c.underline(c.magenta('DATASET')),'=>',pp.render(dataset));		
		console.log(c.underline(c.gray('TYPE')),'=>',pp.render(type));

		// both nodes/edge can have id
		var i = id || (type.opts.id && doc && doc[type.opts.id]);

		// nodes must have an id?
		if(type.isNode){

			if(!i)
				throw new Error(u.format('Must specify id when creating a node! (doc.%s)', type.opts.id));
		
			return f(dataset, type, id, undefined, undefined, doc);
		}

		// we are dealing with an edge
		if(type.isEdge){
			
			// TODO oh oh,.. no this is wrong. Sometimes need s/t, but not for cypher queries. need to restructure this
			if(!i){		
				// if source/target are not specified as parameters,
				// look them up in the document
				var s = ps || (type.opts.source && doc && doc[type.opts.source]);
				var t = pt || (type.opts.target && doc && doc[type.opts.target]);
		
				if(!s)
					throw new Error(u.format("Missing source field '%s'", type.opts.source));
		
				if(!t)
					throw new Error(u.format("Missing target field '%s'", type.opts.target));
		
				var source_id = s;
				var target_id = t;
			
			}
			// if no id is specified, build one
			var canonical_id = i || hashOf([
				source_id.replace('/', '.'),
				type.name,
				target_id.replace('/', '.')				
			]);

			return f(dataset, type, canonical_id, source_id, target_id, doc);
		}
	} 
}

exports.ES_map = normalize(
	function(dataset, type, id, _, _, doc) {
		var body 
		return {
			index: dataset.root,
			type: type.name,
			id: id,
			body: doc
		};
	}
);

exports.Neo_map = normalize(
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

exports.map = function(dataset, type, id, s, t, doc){
	return {
		Elastic: exports.ES_map(dataset, type, id, s, t, doc),
		Neo4J: exports.Neo_map(dataset, type, id, s, t, doc)
	}
}