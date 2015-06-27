var Q = require('kew');
var R = require('ramda');

var log = require('./log');
var mapping = require('./mapping');
var neo = require('./neo4j');

// operate on backend
perform = function(operation, mapping) {
	log.NEO(operation, mapping)

	if(mapping.isNode)
		return neo.node(operation, mapping.params);

	if(mapping.isEdge)
		return neo.edge(operation, mapping.params);
};

function resource(op){
	return function(conn){
		var args = conn.params;
		// console.log(pp.render(args));
		return Q.fcall(function(){
				log.ARGS(args);
				
				// perform normalization & mapping to backends
				var m = mapping(
					args.dataset, args.type, args.splat,
					args.source || args.s, args.target || args.t,
					args.doc
				);
			
				// apply operation on all backends
				return perform(op, m);
			});
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
