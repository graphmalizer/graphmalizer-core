var u = require('util')
var fs = require('fs')

var Q = require('kew')
var R = require('ramda')

var Neo4J = require('neo4j')
var YAML = require('yamljs')

var c = require('./config').Neo4J
var log = require('./log')

var db = new Neo4J.GraphDatabase(u.format('http://%s:%s@%s:%s', c.username, c.password, c.host, c.port));
var qs = YAML.parse(fs.readFileSync('neo4j.yaml', {encoding: 'utf8'}));

var neo = R.curry(
	function(kind, action, params){
		var opts = {
			params: params,
			query: qs[kind][action].cypher
		};
	
		var d = Q.defer();
		log.QUERY(action, opts.query, params)
		db.cypher(opts, function(err,resp){
			if(err) d.reject(err);
			else d.resolve(resp);
		});
		return d.promise;
	}
);

exports.queries = qs

exports.query = neo('queries')
exports.node = neo('node')
exports.edge = neo('edge')

// neo('node','add', {type: 'pit', id: 'id-1'}, {});
// neo('edge','add', {type: 'same-as', s: 'id-1', t: 'id-1'}, {});