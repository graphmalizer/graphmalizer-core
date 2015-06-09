var fs = require('fs');
var R = require('ramda');
var YAML = require('yamljs');

/* Query file format

	---
	metadata (YAML)
	---
	query (Cypher)
	---
	metadata (YAML)
	---
	query (Cypher)
*/

// will be in ramda soon
var splitEvery = require('./splitEvery');

// split on --- and parse front matter/querystring
var queryParser = R.compose(
	R.map(function(query){
		return {
			metadata: YAML.parse(query[0].trim()),
			query: query[1].trim()
		}
	}),
	splitEvery(2),
	R.drop(1),
	R.split('---')
);

// read query file
var s = fs.readFileSync('queries.cypher', {encoding: 'utf8'});

module.exports = queryParser(s);