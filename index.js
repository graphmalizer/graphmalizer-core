var R = require('ramda');
var pp = require('prettyjson');

var qs = require('./queries');

// turn (dataset, type, id, doc) into ES/Neo
var mapping = require('./mapping');


var tests = [
	['bag.nl.straten', 'LIES_IN', null, {from: '2345', to: 'foo/234'}],
	['bag.nl.straten', 'LIES_IN', '123', {from: '2345', to: 'foo/234'}],
	['bag.nl.straten', 'PIT', '123', {a:2345}]
]

tests.forEach(function(args){
	console.log('------------------------------')
	console.log(pp.render({
		dataset: args[0],
		type: args[1],
		id: args[2],
		document: args[3]}));
	console.log('------------------------------')
	var m = mapping.map.apply(null, args);
	console.log(pp.render(m),'\n\n');
	
})
