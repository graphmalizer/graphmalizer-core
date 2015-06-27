var Q = require('kew');
var R = require('ramda');

var log = require('./log');
var mapping = require('./mapping');
var connection = require('./backends')('http://neo4j:waag@localhost:7474');

// operate on backend
perform = function(operation, mapping) {
	log.NEO(operation, mapping)
	return connection[operation](mapping)
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


var queries = R.mapObj(
	
	// set key value to .metadata.description.trim()
	R.compose(
		R.trim(),
		function noEmptyString(s){return s || '-'},
		R.prop('description'),
		R.prop('metadata')
	),
	
	// load queries
	require('./queries')
);

module.exports = {
	POST: resource('add'),
	PUT: resource('update'),
	DELETE: resource('remove'),
	cypher: function(conn) {
		var args = conn.params;
		return Q.fcall(function(){
			return connection.cypher({
				params: args,
				query_name: args.query_name
			});
		});
	},
	list_queries: function(coño) {
		return Q.fcall(function(){
			return queries
		});
	}
}
