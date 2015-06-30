var u = require('util')
var fs = require('fs')
var Q = require('kew')

var c = require('./config').Neo4J

var N = 100; // batch size

var batchCommit = require('../utils/neo4batch');

var qs = [];

var trivial_promise = Q.fcall(function(){
	return true;
});

// run cypher query and return promise
var cypher = function(opts)
{
	// store the query
	qs.push(opts);

	// not at batch size yet, do nothing
	if(qs.length < N)
		return trivial_promise;

	// ok, N-th query added, let's send whole batch
	var d = Q.defer();

	batchCommit(qs, function(result){
		// changes per second
		var cps = qs.length / (result.duration_ms / 1000);
		d.resolve({
			result: result,
			changes_per_sec: cps
		});
	})
	
	// clear query collection again
	qs = []
	
	return d.promise;
}

module.exports = cypher;