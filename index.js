var u = require('util');
var R = require('ramda');
var H = require('highland');
var argv = require('minimist');

var neoBatch = require('./utils/neo4batch');
var Queries =  require('./queries');
var inputChecker = require('./input');

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

function Graphmalizer(userConfig)
{
	// store configuration with user overrides
	var conf = R.merge(defaultConfig, userConfig || {});

	// setup neo4j client
	var batchCommit = H.wrapCallback(neoBatch(conf.Neo4J));

	// setup input checker '~ schema validation'
	var checkInput = inputChecker(conf.types);

	// make query (uses config to determine type ~ structure mapping)
	function prepare(o)
	{
		try
		{
			var input = checkInput(o);
			var q = Queries.mkQuery(input);

			// we have win!
			return [q]
		}
		catch(err)
		{
			// other than spewing, we ignore errors
			console.error(err.stack);

			// so this request will be flatmapped away
			return []
		}
	}

	// stream of input streams
	this.inputs = H();

	// merge all inputs, convert to cypher queries and batch up
	var input = this.inputs
		.merge()
		.flatMap(prepare)
		.batchWithTimeOrCount(argv.batchTimeout || conf.batchTimeout, argv.batchSize || conf.batchSize);

	// commit batches sequentially
	var output = input
		.fork()
		.map(batchCommit) // a -> stream b
		.series()
		.map(function(r){
			console.log("GRAPHMALIZER =>", r.results.length, "docs,", r.duration_ms + "ms");
			return r;
		})
		.pluck('results');

	// zip into [request-batch, response-batch]
	var rr = input
		.fork()
		.zip(output);

	// unzip, flatten batches
	var requests = rr.fork().pluck(0).sequence();
	var responses = rr.fork().pluck(1).sequence();

	// zip back up and turn it into a dictionary
	this.system = requests
		.zip(responses)
		.map(function(rr){
			return {
				request: rr[0],
				response: rr[1]
			}
		});

	// now that all streams are setup, ensure schema creatio
	// todo, actually this sucks because it cannot be run
	// in transaction with write
	//this.inputs.write(H([]));//{query: 'schema'}]));
}

// subscribe a stream to the graphmalizer
Graphmalizer.prototype.register = function(stream)
{	// ensure valid arguments
	if(stream)
	{
		if(!H.isStream(stream))
			throw new Error("Must pass a (highland) stream");

		// register input stream
		this.inputs.write(stream);
	}

	// return stream of all request-responses
	return this.system.fork();
};


module.exports = Graphmalizer;
