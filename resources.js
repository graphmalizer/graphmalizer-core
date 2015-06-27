var Q = require('kew');
var R = require('ramda');

var log = require('./log');
var neo = require('./neo4j');

var Type = require('./type');
var Dataset = require('./dataset');

var parseParams = function(params){
	log.ARGS(params);
	return {
		dataset: params.dataset,
		type: params.type,
		id: params.splat || params.id,
		source: params.source || params.s,
		target: params.target || params.t,
		doc: params.doc
	}
};

function resource(action){
	return function(conn){
		
		// normalize/filter the input
		var input = parseParams(conn.params);
		
		var ds = new Dataset(input.dataset)
		var type = new Type(input.type);
		var id = type.identifier(input);

		log.INPUT({id: id, in_id: input.id, s: input.source, t: input.target})

		return neo.structure(type.structure, action, {
			id: id,
			dataset: ds.name,
			type: type.name,
			source: input.source,
			target: input.target,
			doc: input.doc
		})
	}
}

module.exports = {
	POST: resource('add'),
	PUT: resource('update'),
	DELETE: resource('remove'),
	cypher: function(conn) {
		var args = conn.params;
		return neo.query(args.query_name, args);
	},
	list_queries: function(coño) {
		return Q.fcall(function(){
			return neo.queries
		});
	}
}
