var Q = require('kew');
var R = require('ramda');

var log = require('../utils/log');

var Type = require('./type');
var Dataset = require('./dataset');
var Graph = require('./graph');

exports.modifyDocument = function(action) {
	return function(conn){

		var p = conn.params;
		log.ARGS(p);

		// normalize/filter the input
		var input = {
			dataset: p.dataset,
			type: p.type,
			id: p.splat || p.id,
			source: p.source || p.s,
			target: p.target || p.t,
			doc: p.doc
		};

		// create dataset, type and id
		var ds = new Dataset(input.dataset)
		var type = new Type(input.type);
		var id = type.identifier(input);

		log.INPUT({id: id, in_id: input.id, s: input.source, t: input.target})

		return Graph.structure(type.structure, action, {
			id: id,
			dataset: ds.name,
			type: type.name,
			source: input.source,
			target: input.target,
			doc: input.doc
		})
	}
}

exports.queries = function(coño) {
	return Q.fcall(function(){
		return Graph.queries;
	});
}

exports.query = function(coño) {
	var args = coño.params;
	return Graph.query(args.query_name, args);
}
