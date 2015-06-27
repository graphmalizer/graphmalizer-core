var u = require('util')
var fs = require('fs')
var YAML = require('yamljs')

// run cypher query and return promise
var cypher = require('../utils/neo4j');
var log = require('../utils/log')

var qs = YAML.parse(fs.readFileSync('./core/graph.yaml', {encoding: 'utf8'}));

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

// .structure('node','add', {type: 'pit', id: 'id-1'});
// .structure('edge','add', {type: 'same-as', s: 'id-1', t: 'id-1'});
// .query('klont', {id: 'id-1'});