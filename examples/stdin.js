
// another example

// usage: echo '{"type":"pit", "id":"a"}' | node stdin.js

var H = require('highland');

// read NDJSON from standard input
var stdin = H(process.stdin)

	.splitBy('\n')

	.filter(function(s){
		return s !== '';
	})

	.map(function(s){
		// diff-ish
		if(/^[+-]/.test(s))
		{
			var o = JSON.parse(s.slice(1));
			o.operation = (s[0] == '+' ? 'add' : 'remove');
			return o;
		}

		// regular obj
		return JSON.parse(s);
	});

var graphmalizer = require('./index');

graphmalizer(stdin)
	.each(H.log);
