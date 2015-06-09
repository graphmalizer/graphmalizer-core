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

var queries = require('./queries');

console.log(Object.keys(queries).map(c.bgBlue).join(' '));

exports.Neo4J = function(opts) {
	var db = new Neo4J.GraphDatabase(opts);

	function query(op) {
		// preconstruct query names add_node, ...  remove_edge
		var node = op + '_node';
		var edge = op + '_edge';
		
		return function(thing) {
			var q = thing.isNode ? node : edge;
			console.log(c.bgBlue(q));
		
			thing.query = queries[q].query_string;
			console.log(thing)
			var d = Q.defer();
			db.cypher(thing, function(err,resp){
				if(err) d.reject(err);
				else d.resolve(resp);
			});
			return d.promise;
		};
	}
	
	return {
		add: query('add'),
		update: query('update'),
		remove: query('remove'),
	}
}

