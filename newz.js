var _ = require('highland');

var conf = require('./utils/config')
var Queries = require('./core/queries');

var batchCommit = _.wrapCallback(require('./utils/neo4batch'));

_(process.stdin)
	.splitBy('\n')
	.filter(function(s){
		return s !== '';
	})
	.map(function(s){
		// diff-ish
		if(/^[+-]/.test(s))
		{
			var o = JSON.parse(s.slice(1));
			o.operation = (s[0] == '+' ? 'add' : 'remove');
			return o;
		}

		// regular obj
		return JSON.parse(s);
	})
	.map(function(o) {
		// default operation is add
		o.operation = o.operation || 'add';

		// sourceId is alias for dataset
		o.dataset = o.sourceId || o.dataset || 'stdin';

		// s, t, from, to alias for source/target
		o.source = o.from || o.source || o.s;
		o.target = o.to || o.target || o.t;
		o.id = o.id || o.hgid || o.uri;

		// ensure data field
		o.data = o.data || {};

		// if we have a name, copy into data field
		o.data.name = o.name;

		// strip namespace
		o.type = o.type.replace(/(^hg:)|[-_,;.]/g,'');

		// lookup structure (based on type)
		o.structure = Object.keys(conf.types[o.type])[0];

		// make query
		try{
			return [Queries.mkQuery(o.structure, o.operation, o)];
		}
		catch(e){
			console.log(e);
			return []
		}
	})
	.flatten()
	// batch 'm up, every 1 sec or 2500 items
	.batchWithTimeOrCount(1000, 2500)

	// run in series and flatten output streams
	.map(batchCommit)
	.series()
	.flatten()

	.each(function(result){
		//console.log(result);
		console.log("statusCode:", result.statusCode);
		console.log("changes per second: ",
			(result.result.results.length / (result.duration_ms / 1000)).toFixed(0));
		console.log("Duration MS", result.duration_ms.toFixed(2));
		console.log("Parse MS", result.parse_ms.toFixed(2));
		console.log("errors:\n", (result.result.errors) || 0);
	});
