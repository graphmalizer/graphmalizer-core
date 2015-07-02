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

// lookup query and replace all occurances of «type»
function substitute(cypher, params)
{
	var t = params.type || '_';

	// replace variable «type»
	return cypher.replace(/«type»/g, t.replace(/:/g, '_'));
}

// promise makers
exports.query = function(query_name, params)
{
	// lookup cypher string
	var q = substitute(qs.queries[query_name].cypher, params);

	// report about it
	log.QUERY(query_name, q, params);

	// return promise
	return cypher({params: params, query: q});
}

exports.structure = function(structure, action, params)
{
	// lookup cypher string
	var q = substitute(qs.structures[structure][action].cypher, params);
	
	// report about it
	log.STRUCTURE(structure, action, q, params);	
	
	// return promise
	return cypher({params: params, query: q});
}
