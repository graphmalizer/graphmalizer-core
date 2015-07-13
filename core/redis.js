var argv = require('minimist')(process.argv.slice(2));
var log = require('../utils/log');

var ES = new require('elasticsearch');

var Elastic = function(opts){
	var c = ES.Client(opts);

	// calling c.fn without 2nd argument yields a promise
	var index = c.index.bind(c);
	var remove = c.delete.bind(c);

	return {
		add: index,
		update: index,
		remove: remove
	};
}

// create a promise for each message on redis queue
var Redis = require('redis');
var redis_client = Redis.createClient();
var queueName = argv.q || argv.queue || 'histograph-queue';

var i = 0;

var time = function(){
	var t = process.hrtime();
	var ns = (t[0] * 1e9 + t[1]);
	return ns / 1e9;
}

var t0 = time()

var pp = require('prettyjson')

var loopRedis = function loopRedis(mkPromise)
{
	redis_client.blpop(queueName, 0, function(err,data) {
		var d = JSON.parse(data[1]);
		return mkPromise(d)
			.then(function(response){
				i += 1;
				try
				{
					if((argv.once) || (argv.debug))
						console.log(pp.render(response.result))

					// output
					var r = response.result;
					var per_sec = (argv.batchSize / (r.duration_ms / 1000)).toFixed(2);
					var errs = (r.errors && r.errors.length) || 0;
					var elapsed = time() - t0;
					var agg_rate = (i/elapsed).toFixed(2);
					console.log("Rate / Errors / Count / Agg. Rate:\t", per_sec,'\t',errs,'\t',i, '\t', agg_rate);
				} catch (e) {
				}

				// loop
				process.nextTick(loopRedis.bind(null, mkPromise));
			}, function(err){
				console.error(err);
			});
	});
}

// when passed an object, every fail that contains an object
// is converted into a JSON-string
var stringifyObjectFields = function(obj){
	// convert objects to JSONified strings
  var d = JSON.parse(JSON.stringify(obj));
	if(typeof(d) === 'object')
		Object.keys(d).forEach(function(k){
				var v = d[k];
				if(typeof(v) === 'object')
					d[k] = JSON.stringify(v);
			});

	return d;
}

// normalize identifiers
var normalizeIdentifiers = require('histograph-uri-normalizer').normalize;

function toGraphmalizer(msg, flip)
{
	function norm(x)
	{
		if(x)
			return normalizeIdentifiers(x, msg.sourceid);
		return undefined;
	};

	var d = msg.data;

	return {
		method: {add: "POST", delete: "DELETE", update: "PUT"}[msg.action],
		params: {
			// TODO fix graphmalizer HTTP daemon to accept '.' in datasetname
			dataset: msg.sourceid.replace('.','-'),

			// some old data uses `label` instead of `type`
			type: d.type || d.label,

			// nodes are identified with id's or URI's, we don't care
			id: norm(d.id || d.uri),

			// formalize source/target id's
			source: (flip && norm(d.to)) || norm(d.from),
			target: (flip && norm(d.from)) || norm(d.to)
		}
	}
}

var r = require('./resources');
var E = new Elastic({host: 'localhost:9200'});

loopRedis(function(msg){

	var conn_mock = toGraphmalizer(msg, false);

	// convert objects into strings (Neo4J cannot object)
	var doc = (msg.data && stringifyObjectFields(msg.data)) || {}
	conn_mock.params.doc = doc;

	var op = {add: "add", delete: "remove", update: "update"}[msg.action]
	var p = r.modifyDocument(op)(conn_mock);

	p = p.then(function(neo_result){

    // Add sourceid/dataset
    // TODO: change sourceid to dataset - here and everywhere
    var data = msg.data;
    data.sourceid = msg.sourceid;

		return E[op]({
			index: conn_mock.params.dataset,
			type: conn_mock.params.type,
			id: conn_mock.params.id,
			body: data
		}).then(function(){
			// after indexing into ES, we return the neo result
			return neo_result;
		});
	});

	return p;
});

