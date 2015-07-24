var argv = require('minimist')(process.argv.slice(2));

var u = require('util');
var _ = require('highland');
var prttty = require('prttty');

var conf = require('./../utils/config');

var Queries = require('./queries');
var batchCommit = _.wrapCallback(require('./../utils/neo4batch'));

var types = Object.keys(conf.types).join(', ');

function toQuery(o)
{
	// default operation is add
	o.operation = o.operation || 'add';

	// default dataset is stdin
	o.dataset = o.dataset || 'stdin';

	// s, t alias for source/target
	o.source = o.source || o.s;
	o.target = o.target || o.t;

	// ensure (empty) data field
	o.data = o.data || {};

	// check if we have defined the type
	if(! conf.types[o.type])
	{
		console.error(u.format('Unknown type "%s", must be one of: %s', o.type, types));
		return []
	}

	// lookup structure (based on type)
	o.structure = Object.keys(conf.types[o.type])[0];

	if(!argv.stfu)
		console.log(prttty.render(o));

	try
	{
		return [Queries.mkQuery(o)];
	}
	catch(err)
	{
		console.error(err.stack);
		return []
	}
}

// if you want to ensure that all rqs' go through one pipe,
// you need to take care of fork, merge etc..

module.exports = _.pipeline(

	// turn into query,
	_.map(toQuery),
	_.flatten(),

	// batch 'm up, every 1 sec or 2500 items
	_.batchWithTimeOrCount(1000, 2500),

	// run in series and flatten output streams
	_.map(batchCommit),
	_.series(),
	// TODO map results back into individual requests
	_.flatten(),

	_.map(function reporting(result){

		console.log("statusCode:", result.statusCode);
		console.log("changes per second: ",
			(result.result.results.length / (result.duration_ms / 1000)).toFixed(0));
		console.log("Duration MS", result.duration_ms.toFixed(2));
		console.log("Parse MS", result.parse_ms.toFixed(2));
		console.log("errors:\n", (result.result.errors) || 0);

		// nothing, move along please..
		return result;
	})
);
