var u = require('util')
var fs = require('fs')

var Q = require('kew')
var R = require('ramda')

var Neo4J = require('neo4j')
var YAML = require('yamljs')

var c = require('./config').Neo4J
var log = require('./log')

var db = new Neo4J.GraphDatabase(u.format('http://%s:%s@%s:%s', c.username, c.password, c.host, c.port));
var qs = YAML.parse(fs.readFileSync('./core/neo4j.yaml', {encoding: 'utf8'}));

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

// definitions
exports.queries = qs.queries
exports.structures = qs.structures

// promise makers
exports.query = function(query_name, params)
{
	// lookup query
	var q = qs.queries[query_name].cypher;

	// report about it
	log.QUERY(query_name, q, params);

	// return promise
	return cypher({params: params, query: q});
}
exports.structure = function(structure, action, params)
{
	// lookup query
	var q = qs.structures[structure][action].cypher;
	
	// report about it
	log.STRUCTURE(structure, action, q, params);	
	
	// return promise
	return cypher({params: params, query: q});
}

// neo.structure('node','add', {type: 'pit', id: 'id-1'});
// neo.structure('edge','add', {type: 'same-as', s: 'id-1', t: 'id-1'});
// neo.query('klont', {id: 'id-1'});