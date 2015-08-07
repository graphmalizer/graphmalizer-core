// another example
var Graphmalizer = require('../index');
var H = require('highland');
var R = require('ramda');
var pp = require('prttty');

// tester
var test = require('tape').test;

// load tests from file
var fs = require('fs');
var yaml = require('js-yaml');
var f = fs.readFileSync('test/runSome.yaml', {encoding: 'utf8'});
var spec = yaml.safeLoad(f, {filename: './tests.yaml'});


function run(tname, statements) {

	// make test stream
	var s = R.prepend({query:'clear'}, statements);
	var tests = H(s)
		.map(function(statement){
			statement.dataset = 'test';
			return statement;
		});

	test(tname, function(t){

		t.plan(s.length);

		// instantiate
		var G = new Graphmalizer({batchTimeout: 10});

		var g = G
			.register(tests)
			.each(function(x){
				t.assert(x.response.length == 1, "we have one row in response");
			})
			.done(function(){
				console.log('done');
				t.end();
			})
	})
}

for(tname in spec.alt)
	run(tname, spec.alt[tname]);

