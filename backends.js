var ES = new require('elasticsearch');
exports.Elastic = function(opts){
	var c = ES.Client(opts);

	// calling c.fn without 2nd argument yields a promise
	var index = c.index.bind(c);
	var remove = c.delete.bind(c);
	
	return {
		add: index,
		update: index,
		remove: remove
	};
}


var Neo4J = new require('neo4j')
var R = require('ramda');
var Q = require('kew');
var c = require('chalk');
var u = require('util');
var pp = require('prttty');

var queries = require('./queries');

function stringifyObjects(d){
	// convert objects to JSONified strings
	if(typeof(d) === 'object')
		Object.keys(d).forEach(function(k){
				var v = d[k];
				if(typeof(v) === 'object')
					d[k] = JSON.stringify(v);
			});
		}
}


exports.Neo4J = function(opts) {
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
		
		stringifyObjects(thing.params.doc);

		// insert proper querystring
		thing.query = queries[query_name].query_string;
		
		console.log(c.bgBlue(query_name), c.underline(thing.query) ,'~', pp.render(thing.params));
		
		// execute query
		return cypher(thing);
	}

	function query(op) {
		// preconstruct query names add_node, ...  remove_edge
		var node = op + '_node';
		var edge = op + '_edge';
		
		return function(thing) {
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