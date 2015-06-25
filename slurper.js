var fs = require('fs');
var u = require('util');
var c = require('chalk');
var redis = require('redis');
var pp = require('prttty');
var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var normalizer = require('histograph-uri-normalizer');

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


function normalize(id, uri, dataset){
	if(id)
		return 'urn:' + dataset + ':' + id;

	try {
		return normalizer.URLtoURN(uri, dataset);
	} catch(e) {
		
		// if uri like 'bag/123'
		// then return urn: ...
		if(/^[\w\d-_]+\/.*$/.test(uri) || /^[\w\d-_]+$/.test(uri))
			return 'urn:' + dataset + ':' + uri;

		return uri;
	}
}

function toGraphmalizer(data){

	var method = {add: 'post', delete: 'delete',update: 'put'}[data.action];
	
	// should change server.js to accept '.' in datasetname
	return {
		dataset: data.sourceid.replace('.','-'),
		type: computeType(data),
		method: method,
		id: normalize(data.data.id, data.data.uri, data.sourceid),
		source: (data.data.from && normalize(undefined, data.data.from, data.sourceid)) || undefined,
		target: (data.data.to && normalize(undefined, data.data.to, data.sourceid)) || undefined,
		document: data.data
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
