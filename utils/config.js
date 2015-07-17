var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var R = require('ramda');

// default configuration
var system = {
	Neo4J: {
		host: 'localhost',
		port: 7474
	},

	// behave like a graph with equivalences
	types: {
		"node": {
			node: {}
		},
		"arc": {
			arc: {}
		},
		"equivalence": {
			equivalence: {}
		}
	}
};

// load json from a file and if there, throw parse errors
function tryLoadJSON(fn){
	// try to read the file, ignore if it's not there
	try {
		var f = fs.readFileSync(fn);
	} catch(_){};

	// if we have a file, parse it and set user obj
	if(f)
		return JSON.parse(f.toString());	
}

// specify config file using
//
// - environment var GRAPHMALIZER_CONFIG
// - commandline argument --config
// - or using "config.json" in the current directory
//
var user = tryLoadJSON(process.env.GRAPHMALIZER_CONFIG || argv.config || 'config.json');

module.exports = R.merge(system, user);