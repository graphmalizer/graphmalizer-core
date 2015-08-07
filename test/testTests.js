var test = require('tape').test;
var H = require('highland');

// load tests from file
var fs = require('fs');
var yaml = require('js-yaml');
var f = fs.readFileSync('./tests.yaml', {encoding: 'utf8'});
var tests = yaml.safeLoad(f, {filename: './tests.yaml'});

tests.output = {};

var Graphmalizer = require('../index');

for(tname in tests.input) {

	// create a test, streams input to graphmalizer and compares results
	test(tname, function (t) {

		t.plan(2);

		// commands to run
		var inputs = tests.input[tname];

		var size = inputs.split('\n').length;

		// make inputs stream
		var s = H(inputs.split('\n'))
			.filter(function(s){
				return (s.trim()) !== '';
			})
			.map(function(s) {
				// regular obj
				console.log("'",s,"'")
				return JSON.parse(s);
			});

		var g = new Graphmalizer()
			.register(s);

		// checkpoint
		t.pass('registered stream to graphmalizer');

		g = g.errors(function (err) {
			t.error(err, 'an error was thrown in the output stream');
		});

		g.toArray(function (xs) {
			console.log(xs);
			// assume input.length == output.length
			t.equal(xs.length, size, 'for each statement we have one reponse, input.length == output.length');

			console.log(xs);
		});

	});

}

