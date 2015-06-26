var argv = require('minimist')(process.argv.slice(2));
var R = require('ramda');

// default configuration
var system = {
	Neo4J: {
		host: 'localhost',
		port: 7474,
		username: 'neo4j',
		password: 'waag'
	},

	// behave like a graph
	types: {
		"node": {
			node: {}
		},
		"edge": {
			edge: {}
		}
	}
}

// specify config file using environment var GRAPHMALIZER_CONFIG
// commandline argument --config
// or using "config.json" in the current directory
var user = require(process.env.GRAPHMALIZER_CONFIG || argv.config || './config.json');

module.exports = R.merge(system, user);