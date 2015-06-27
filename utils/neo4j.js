var u = require('util')
var fs = require('fs')

var Q = require('kew')

var Neo4J = require('neo4j')

var c = require('./config').Neo4J
// var log = require('./log')

var db = new Neo4J.GraphDatabase(u.format('http://%s:%s@%s:%s',c.username, c.password, c.host, c.port));

// run cypher query and return promise
var cypher = function(opts)
{
	var d = Q.defer();
	db.cypher(opts, function(err,resp){
		if(err) d.reject(err);
		else d.resolve(resp);
	});
	return d.promise;
}

module.exports = cypher;