var fs = require('fs');
var u = require('util');
var c = require('chalk');
var redis = require('redis');
var pp = require('prttty');
var argv = require('minimist')(process.argv.slice(2));

var queueName = argv.q || argv.queue;
if(!queueName) {
	console.log("usage: node ./slurper.js --queue 'name'");
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

function put_thing_in_thing()
{
	client.blpop(queueName, 0, function(err,data){

		if(err)
		{
			console.error(err);
			process.exit(-1);
		}


		var d = JSON.parse(data[1]);

		// select type
		var type = what_thing_is_this(d);

		console.log(type[0](type[1]), '=>', pp.render(d));

		do_thing_to_it(type[1], d);


	});
}

put_thing_in_thing();

function what_thing_is_this(data){

	var l = data.label;
	var t = data.type;

	if(l === "hg:liesIn")
		return [c.bgBlue, 'LIES_IN'];

	if(l === "hg:sameHgConcept")
		return [c.bgYellow, 'SAME_AS'];

	if (/^hg:/.test(t))
		return [c.bgCyan, 'PIT'];

	return [c.bgRed, 'UNKNOWN'];
}



function do_thing_to_it(type, data){

	var dataset = 'test';
	var uri = u.format('/%s/%s', dataset, type)
	if (data.id)
		uri += '/' + data.id;

	var request = require('request');
	var doc = data.data || data || {};

	if(data.name)
		doc.name = data.name;

	if(data.type)
		doc.hgType = data.type;

	if(data.geometry)
		delete data.geometry;
		// doc.geometry = docata.geometry;

	// var doc = {he:123, werkt: { niet: [1,2,3] }};

	console.log(c.bgWhite('REQ'), '=>', uri, pp.render(doc));
	request.post('http://localhost:5000' + uri, {form: {doc: doc}}, function(err,resp,body){
		var f = (body && JSON.parse(body).ok) ? c.bgGreen : c.bgRed;
		console.log(f('RES', '<=', body));
		// loop
		process.nextTick(put_thing_in_thing);
	});

}
