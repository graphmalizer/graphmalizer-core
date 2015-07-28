var _ = require('highland');
var prttty = require('prttty');
var Queries = require('./core/queries');

var conf = require('./utils/config');
var log = require('./utils/log');
var batchCommit = _.wrapCallback(require('./utils/neo4batch'));

// stream of input streams
var streams = _();

// processing pipeline
var input = streams.merge()
	.flatMap(prepare)
	.batchWithTimeOrCount(1000, 2500);

var output = input.fork()
	.map(batchCommit) // a -> stream b
	.series()
	.map(unwrapResult);

// zip into [request, response]
var rr = input.fork()
	.zip(output);

var I = rr.fork().pluck(1).sequence();
var O = rr.fork().pluck(1).sequence();
var system = I.zip(O)
	.map(function(rr){
		return {
			request: rr[0],
			response: rr[1]
		}
	});

module.exports = function(stream) {

	if(stream)
	{
		if(!_.isStream(stream))
			throw new Error("Must pass a (highland) stream");

		streams.write(stream);
	}

	// so that you can operate on it
	return system.fork();
};


// make query
function prepare(o)
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

	//console.log(prttty.render(o));

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

/*
	results: [
		{ columns: ["n"]
		, data: [
			{ row: [
				{ id: "a"
				, dataset: "stdin"
				, accessTime: 1437955066039
				, counter: 1
				}
			]
		}]
	}]

	~>

	[{n:
		{ id: "a"
		, dataset: "stdin"
		, accessTime: 1437955066039
		, counter: 1
		}
	}]
*/

function unwrapResult(x){
	// create dictionary for each row
	// {columnName: row[ columnIndex ]}
	return x.result.results.map(function(entry){
		return entry.data.map(function(d){
			return entry.columns.reduce(function(acc, n, i){
				acc[n] = d.row[i];
				return acc;
			}, {});
		});
	});
}
