var R = require('ramda');
var c = require('chalk');
var u = require('util');
var ppp = require('prttty');

var pp = {
	render: R.compose(
		ppp.render.bind(ppp),
		R.omit(['doc','params']))
}

exports.pp = pp;

var arrow = c.gray('=>');
var twidle = c.gray('~')

var log2 = function(a,b){
	console.log(a,arrow,b,'\n');
}
var log3 = function(a,b,c){
	console.log(a,twidle,b,arrow,c,'\n');
}

var log4 = function(a,b,c,d){
	console.log(a,twidle,b,arrow,'\n\t query:',c,'\n\t params:',d,'\n');
}

var logObj = R.curry(function(color, thing, json) {
	log2(color(thing), pp.render(json));
});

var logErr = function(err) {
	log2(c.red("ERR"), err.message);
	console.error(err.stack);
};


var opColors = {
	add: c.bgGreen,
	update: c.bgYellow,
	remove: c.bgRed,
};

var logOp = R.curry(function(color, thing, op, json) {
	log3(color(thing), opColors[op](op), pp.render(json))
})

var logQuery = R.curry(function(color, thing, op, query, params) {
	log4(color(thing), c.bgBlue(op), c.underline(query), pp.render(params))
})

// json -> logmsg
exports.REQ = logObj(c.magenta, "REQ")
exports.ARGS = function() {} //logObj(R.compose(c.underline, c.blue), "ARGS")
exports.DATASET = function() {} // logObj(R.compose(c.underline, c.magenta), "DATASET")
exports.TYPE = logObj(R.compose(c.underline, c.gray), "TYPE")

// op, json -> logmsg
exports.NEO = logOp(R.compose(c.underline, c.yellow), "Neo4J")
exports.Elastic = logOp(R.compose(c.underline, c.magenta), "Elastic")

// op, query, params -> logmsg
exports.QUERY = logQuery(R.compose(c.underline, c.magenta), "DATASET")

// err -> logmsg
exports.ERR = logErr;

