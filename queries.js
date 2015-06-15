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

var c = require('chalk');

var stripComments = function(match, p1){
	return p1;
}
var compactQuery = R.compose(
	// join back into single line string
	R.join(' '),
	
	// remove spaces
	R.map(R.trim()),
	
	// remove empty lines
	R.filter(function emptyLine(line){
		return !/^$/.test(line.trim());
	}),

	// remove comments
	R.map(R.replace(/#.*$/, '')),
	
	// split on newlines
	R.split('\n')
)

var reportQuery = function(q){
	var i = 20 - q.metadata.name.length
	var fill = R.repeat(' ', i).join('');
	return ' ' + c.bgBlue(' ' + q.metadata.name + ' ') + fill + (q.metadata.description || '').trim();
};

var HR = R.repeat('-', 20).join('');
var reportQueries = function(qs){
	console.log(HR);
	console.log(qs.map(reportQuery).join('\n'));
	console.log(HR);
	return qs;
};

// split on --- and parse front matter/querystring
var queryParser = R.compose(
	R.reduce(function(acc, val){
		acc[val.metadata.name] = val;
		return acc;
	}, {}),
	reportQueries,
	R.filter(function(obj){
		return (obj.metadata && obj.metadata.name) || false;
	}),
	R.map(function tap(pair){
		return {
			metadata: YAML.parse(pair[0].trim()),
			query_string: compactQuery(pair[1])
		};
	}),
	splitEvery(2),
	R.drop(1),
	R.split('---')
);

// read query file
var s = fs.readFileSync('queries.cypher', {encoding: 'utf8'});

module.exports = queryParser(s);