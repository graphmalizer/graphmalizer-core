var u = require('util');

var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

var template = require('../utils/template');

// load queries from file
var fn = path.join(__dirname, 'queries.yaml');
var f = fs.readFileSync(fn, {encoding: 'utf8'});
var qs = yaml.safeLoad(f, {filename: fn})

// make cypher queries out of structure manipulation request
exports.mkQuery = function(request)
{
	var structure = request.structure;
	var operation = request.operation;

	if(!qs[structure])
		throw new Error(u.format('No such structure "%s"', structure));

	if(!qs[structure][operation])
		throw new Error(u.format('No such operation "%s" on "%s"', operation, structure));

	if(!qs[structure][operation].cypher)
		throw new Error(u.format('No cypher query defined for operation "%s" on "%s"', operation, structure));

	// lookup query string and...
	var cypher_string = qs[structure][operation].cypher;

	// ...string replace all occurances of «type»
	var s = template(cypher_string, {type: request.type});

	// neo4batch ready dictionary
	return {
		parameters: request,
		statement: s
	};
};

exports.structures = qs;
