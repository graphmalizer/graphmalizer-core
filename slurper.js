var fs = require('fs');
var u = require('util');
var c = require('chalk');
var redis = require('redis');
var pp = require('prttty');
var argv = require('minimist')(process.argv.slice(2));
var request = require('request');

var normalize = require('./identifiers');

var queueName = argv.q || argv.queue || 'histograph-queue';
if(!queueName) {
	console.log("usage: node ./slurper.js --queue 'name' --host 'hostname'");
	process.exit(-1);
}

var client = redis.createClient();

function die(err, why){
	if(err)
	{
		console.log(why);
		console.error(err);
		process.exit(-1);
	}
}

function computeType(data){
	var kind = data.type;
	var t = data.data.type;

	if(kind === 'pit')
		return 'PIT';

	if(t === 'hg:liesIn')
		return 'LIES_IN';

	if(t === 'hg:sameHgConcept')
		return 'SAME_AS';

	die(null, "don't know the type " + t);
}

function toGraphmalizer(data){

	// // convert objects to JSONified strings
	// Object.keys(data.data).forEach(function(k){
	// 	var v = data.data[k];
	// 	if(typeof(v) === 'object')
	// 		data.data[k] = JSON.stringify(v);
	// });
	
	var method = {add: 'post', delete: 'delete',update: 'put'}[data.action];

	function norm(x){
		if(x)
			return normalize(x, data.sourceid);

		return undefined;
	}

	var d = data.data;
	var i = d.id || d.uri; // nodes are identified with id's or URI's, we don't care.

	// should change server.js to accept '.' in datasetname
	return {
		dataset: data.sourceid.replace('.','-'),
		type: computeType(data),
		method: method,
		id: norm(i),
		source: norm(d.from),
		target: norm(d.to),
		document: d
	}
}

function parseJSON(s){
	try {
		return JSON.parse(s)
	}
	catch(e) {
		return undefined
	}
}

function runQueue()
{
	client.blpop(queueName, 0, function(err,data){
		var d = JSON.parse(data[1]);
		var rq = toGraphmalizer(d);	
		
		var uri = u.format('http://localhost:5000/%s/%s', rq.dataset, rq.type);
		if (rq.id)
			uri += '/' + rq.id;

		console.log(c.bgWhite('REQ'), '=>', uri, pp.render(rq));
		
		request[rq.method](uri, (rq.document && {form: {doc: rq.document}}) || {},
			function(err,resp,body){
				die(err, "error while posting!")
				var j = parseJSON(body)
				var f = (j && j.ok) ? c.bgGreen : c.bgRed;
				console.log(f('RES', '<=', body));
				// loop
				process.nextTick(runQueue);
			});
	});
}

runQueue();
