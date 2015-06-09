var R = require('ramda');
var ES = new require('elasticsearch');
var Neo4J = new require('neo4j')
exports.Elastic = function(opts){
	var c = ES.Client(opts);

	// index or remove from ES
	var index = c.index.bind(c);
	var remove = c.delete.bind(c);
	
	return {
		add: index,
		update: index,
		remove: remove
	};
}

var queries = require('./queries');

console.log(queries);//Object.keys(queries).map(require('chalk').bgYellow).join(' '));

exports.Neo4J = function(opts) {
	var db = new Neo4J.GraphDatabase(opts);

	function query(op) {
		// preconstruct query names add_node, ...  remove_edge
		var node = op + '_node';
		var edge = op + '_edge';
		
		return R.compose(
			db.cypher,
			function(thing) {
				var q = thing.isNode ? node : edge;
				console.log(require('chalk').bgBlue(q));
				thing.query = queries[q].query_string;
				console.log(thing)
				return thing;
			}
		)
	}
	
	return {
		add: query('add'),
		update: query('update'),
		remove: query('remove'),
	}
}

