var argv = require('minimist')(process.argv.slice(2));
var log = require('../utils/log');

// create a promise for each message on redis queue
var Redis = require('redis');
var redis_client = Redis.createClient();
var queueName = argv.q || argv.queue || 'histograph-queue';

var loopRedis = function loopRedis(mkPromise)
{
	redis_client.blpop(queueName, 0, function(err,data) {
		var d = JSON.parse(data[1]);
		return mkPromise(d)
			.then(function(){
				// loop
				process.nextTick(loopRedis.bind(null, mkPromise));
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

// 	add: r.modifyDocument('add'),
// 	update: r.modifyDocument('update'),
// 	remove: r.modifyDocument('remove'),
// 	queries: r.queries,
// 	query: r.query

loopRedis(function(msg){

	var conn_mock = toGraphmalizer(msg, false);

	// convert objects into strings (Neo4J cannot object)
	var doc = (msg.data && stringifyObjectFields(msg.data)) || {}
	conn_mock.params.doc = doc;

	var op = {add: "add", delete: "remove", update: "update"}[msg.action]
	var p = r.modifyDocument(op)(conn_mock);
	// console.log(p)
	
	// add opposite edge as well
	if(msg.type === 'hg:sameHgConcept')
	{
		// add flipped edge, a <- b
		p = p.then(function(){
			console.log('BIDIR')
			var m2 = toGraphmalizer(msg, true);
			m2.params.doc = doc;
			return r.modifyDocument(op)(m2);
		});
	}

	return p;
});

