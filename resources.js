var Q = require('kew');
var R = require('ramda');
var c = require('chalk');
var u = require('util');
var pp = require('prttty');

var mapping = require('./mapping')
var backends = require('./backends');
var connection = backends('http://neo4j:waag@localhost:7474');

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
perform =function(operation, mapping) {
	var op = colours.operation[operation](u.format(' %s ',operation));
	console.log(c.gray('NEO =>'), op, ' ~ ', pp.render(mapping))
	return connection[operation](mapping);
};

function resource(op){
	return function(conn){
		var args = conn.params;
		console.log(pp.render(args));
		return Q.fcall(function(){
				console.log(c.underline(c.blue('ARGS')),'=>',pp.render(args));
				
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
