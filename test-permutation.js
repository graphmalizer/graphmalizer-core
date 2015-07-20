var R = require('ramda');
var hashOf = require('./utils/hashOf');
var _ = require('highland');

var conf = require('./utils/config');
var Queries = require('./core/queries');
var batchCommit = _.wrapCallback(require('./utils/neo4batch'));

var Combinatorics = require('js-combinatorics');

function mkQuery(s){
	return [{statement: s, parameters: {}}];
}

// delete everything
var clearDB = mkQuery(
	"MATCH n OPTIONAL MATCH n-[e]-() DELETE e, n RETURN DISTINCT true;"
);

// get all node, edge id's
var enumerateDB = mkQuery(
	"MATCH (n) OPTIONAL MATCH (n)-[e]-()" +
	"RETURN collect(DISTINCT n.id), collect(DISTINCT e.id)"
);

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
		o.dataset = o.sourceId || o.dataset;

		// s, t, from, to alias for source/target
		o.source = o.from || o.source || o.s;
		o.target = o.to || o.target || o.t;

		// ensure data field
		o.data = o.data || {};

		// if we have a name, copy into data field
		o.data.name = o.name;

		// lookup structure (based on type)
		o.structure = Object.keys(conf.types[o.type])[0];

		// strip namespace
		o.type = o.type.replace(/(^hg:)|[-_,;.]/g,'');

		// make query
		return Queries.mkQuery(o.structure, o.operation, o);
	})
	.collect()
	.consume(function (err, x, push, next){
		if (err) {
			// pass errors along the stream and consume next value
			push(err);
			next();
		}
		else if (x === _.nil) {
			// pass nil (end event) along the stream
			push(null, x);
		}
		else {
			// emit all permutations of these messages
			var permutations = Combinatorics.permutation(x);
			permutations.forEach(function(permutation){
				push(null, permutation);
			});
			next();
		}

	})
	.map(function(permutation) {
		// clear, query, enumerate
		return clearDB
			.concat(permutation)
			.concat(enumerateDB);
	})
	.map(batchCommit)
	.series()
	.flatten()
	.each(function(data){
		// find the rows
		var d = R.last(data.result.results).data;

		// for each row, output the first and second column
		d = R.flatten(d.map(function(dd){
			return [dd.row[0], dd.row[1]]
		}));

		// hash sorted id's
		var ghash = hashOf(d.sort());

		console.log("GHASH =>", ghash)
	});
