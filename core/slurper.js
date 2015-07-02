var argv = require('minimist')(process.argv.slice(2));

var Q = require('kew');

// var fs = require('fs');

var u = require('util');
var c = require('chalk');
var pp = require('prttty');

// only log when `--once` is passed
var log = exports.log = ((argv.once || argv.verbose) && console.log.bind(console)) || function (){};

// die on error
var die = exports.die = function die(err, why) {
	if(err) {
		console.log(why);
		console.error(err);
		process.exit(-1);
	}
}

// create a promise for each message on redis queue
var Redis = require('redis');
var redis_client = Redis.createClient();
var queueName = argv.q || argv.queue || 'histograph-queue';

exports.loopRedis = function loopRedis(mkPromise)
{
	redis_client.blpop(queueName, 0, function(err,data) {
		var d = JSON.parse(data[1]);
		log('REDIS <=', pp.render(d));

		return mkPromise(d)
			.then(function(){
				// run once, so do nothing
				if(argv.once)
					return;
				
				// loop
				process.nextTick(exports.loopRedis.bind(null, mkPromise));
			});
	});
}

// try to parse JSON or return undefined
exports.parseJSON = function parseJSON(s) {
	try {
		return JSON.parse(s)
	}
	catch(e) {
		return undefined
	}
}

// when passed an object, every fail that contains an object
// is converted into a JSON-string
exports.stringifyObjectFields = function(obj){
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

// we expect:
//
// - action,
// - dataset,
// - type,
// - id,
// - doc
//
var ES = new require('elasticsearch');
var es_client = ES.Client({host: 'localhost:9200'});

// calling c.fn without 2nd argument yields a promise
var index = es_client.index.bind(es_client);
var remove = es_client.delete.bind(es_client);

// index documents into elasticsearch
exports.putElastic = function(data)
{
	// select appropriate ES operation
	var operation = {
		add: index,
		update: index,
		delete: remove
	}[data.action];

	var opts = {
		index: data.dataset,
		type: data.type,
		id: data.id,
		body: data.doc
	};

	log('Elastic ~~', pp.render(opts));

	// run it
	return operation(opts)
			.then(function(resp){
				log("Elastic =>", pp.render(resp));
			}, function(err){
				die(err, 'when writing to Elastic')
			});	
}