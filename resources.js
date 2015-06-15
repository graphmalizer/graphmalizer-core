var Q = require('kew');
var R = require('ramda');
var c = require('chalk');
var u = require('util');
var pp = require('prttty');

var mapping = require('./mapping')

var backends = require('./backends');

var connections = {
	Elastic: backends.Elastic({host: 'localhost:9200'}),
	Neo4J: backends.Neo4J('http://neo4j:waag@localhost:7474')
}

var colours = {
	operation: {
		add: c.bgGreen,
		update: c.bgYellow,
		remove: c.bgRed,
	},
	backend: {
		Elastic: R.compose(c.underline, c.magenta),
		Neo4J: R.compose(c.underline, c.yellow)
	}
}

// operate on backend
perform = R.curry(function(operation, mapping, backend) {
	// creates a promise
	var be = colours.backend[backend](u.format('[%s]',backend))
	var op = colours.operation[operation](u.format(' %s ',operation));
	console.log(be, c.gray('=>'), op, ' ~ ', pp.render(mapping[backend]))
	return connections[backend][operation](mapping[backend]);
});

function resource(op){
	return function(conn){
		var args = conn.params;
		console.log(pp.render(args));
		return Q.fcall(function(){
				// perform normalization & mapping to backends
				var m = mapping.map(
					args.dataset, args.type, args.id,
					args.source || args.s, args.target || args.t,
					args.doc
				);
			
				// apply operation on all backends
				var P = perform(op, m);
				return Q.all(['Elastic', 'Neo4J'].map(P));
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
			return connections.Neo4J.cypher({
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