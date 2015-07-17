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
		o.dataset = o.sourceId || o.dataset;
		o.source = o.from || o.source || o.s;
		o.target = o.to || o.target || o.t;

		// ensure data field
		if(!o.data)
			o.data = {};

		o.data.name = o.name;
		o.structure = Object.keys(conf.types[o.type])[0];
		o.type = o.type.replace(/(^hg:)|[-_,;.]/g,'');

		// make query
		return Queries.mkQuery(o.structure, o.operation, o);
	})
	.batchWithTimeOrCount(1000, 2500)
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
