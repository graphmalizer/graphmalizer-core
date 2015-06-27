var Neo4J = new require('neo4j')
var R = require('ramda');
var Q = require('kew');
var u = require('util');

var log = require('./log');
var queries = require('./queries');


module.exports = function(opts) {
	var db = new Neo4J.GraphDatabase(opts);

	// execute cypher query and return a promise
	var cypher = function(args)
	{
		var d = Q.defer();
		db.cypher(args, function(err,resp){
			if(err) d.reject(err);
			else d.resolve(resp);
		});
		return d.promise;
	}

	var exec = function(thing, query_name) {
		// check if query exists
		if(!queries[query_name])
			throw new Error(u.format("No such query, '%s'", query_name));
		
		// insert proper querystring
		thing.query = queries[query_name].query_string;
		
		log.QUERY(query_name, thing.query, thing.params);
		
		// execute query
		return cypher(thing);
	}

	function query(op) {
		// preconstruct query names add_node, ...  remove_edge
		var node = op + '_node';
		var edge = op + '_edge';
		
		return function(thing) {
			// query name = `[OPERATION]_[NODE|EDGE]`
			// thing.params.labels = thing.params.labels
			// 	.map(function(l){
			// 		return ':' + l;
			// 	})
			// 	.join('');

			var query_name = thing.isNode ? node : edge;

			// execute query
			return exec(thing, query_name)
				.fail(function(err){
					// ah, we know what this is!
					if(err.neo4j && err.neo4j.code === 'Neo.ClientError.Schema.ConstraintViolation')
						throw new Error(u.format("Node with id '%s' already exists", thing.params.id));

					// ok, no idea, just fail again
					throw err;
				});
		};
	}
	
	return {
		add: query('add'),
		update: query('update'),
		remove: query('remove'),
		cypher: function(params) {
			return exec(params, params.query_name);
		}
	}

}