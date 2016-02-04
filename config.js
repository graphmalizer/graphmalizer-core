var R = require('ramda');

var defaultConfig = {
	Neo4J: {
		hostname: 'localhost',
		port: 7474
	},

	batchTimeout: 1000,
	batchSize: 2500,

	// behave like a graph with equivalences
	types: {
		node: {
			node: {}
		},
		arc: {
			arc: {}
		},
		equivalence: {
			equivalence: {}
		}
	}
};

function detectDockerLink() {
  var addr = process.env.NEO4J_PORT_7474_TCP_ADDR
	var port = process.env.NEO4J_PORT_7474_TCP_PORT

  // address specified?
	var addr = process.env.NEO4J_PORT_7474_TCP_ADDR
	if(!addr)
		return {}

	// port specified?
	var port = process.env.NEO4J_PORT_7474_TCP_PORT
	if(!port)
		return {}

	// found correct docker links, create and return config
	return {
		Neo4J: {
			hostname: addr,
			port: port
		}
	};
}

module.exports = function (userConfig) {
  // store configuration with user overrides
	var conf = R.merge(defaultConfig, userConfig || {});

	// detect docker links
	var dockerConf = detectDockerLink()

  // override user config with docker link config
	return R.merge(conf, dockerConf)
}
