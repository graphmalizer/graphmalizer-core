var u = require('util');
var fs = require('fs');
var YAML = require('yamljs');

var hashOf = require('../utils/hashOf');
var template = require('../utils/template');

var hashSourceTarget = function(input)
{
	if(!input.id && (!input.source || !input.target || !input.type))
		throw new Error(u.format("Type '%s' requires id or source, target", input.type));

	return input.id || hashOf([input.source,input.type,input.target]);
};

var requireId = function(input)
{
	if(!input.id)
		throw new Error(u.format("Type '%s' requires an id", input.type));

	return input.id;
};

// we define how identifiers are created for each structure here
var identifiers = {
	node: requireId,
	arc: hashSourceTarget,
	equivalence: hashSourceTarget
};

// load queries from file "structure.operation.{ cypher, description }"
var qs = YAML.parse(fs.readFileSync('./core/queries.yaml', {encoding: 'utf8'}));

// make cypher queries out of structure manipulation request
exports.mkQuery = function(request)
{
	var operation = request.operation;
	var structure = request.structure;

	if(!qs[structure])
		throw new Error(u.format('No such structure "%s"', structure));

	if(!qs[structure][operation])
		throw new Error(u.format('No such operation "%s" on "%s"', operation, structure));

	// lookup query string and...
	var cypher_string = qs[structure][operation].cypher;

	// ...string replace all occurances of «type»
	var s = template(cypher_string, {type: request.type});

	// note ^ this is not a security breach, we assume input has been sanitized
	// at this point. TODO actually we assume, but don't sanitise

	// compute id if missing
	request.id = identifiers[structure](request);

	// return promise
	return {
		parameters: request,
		statement: s
	};
};

exports.structures = qs;
