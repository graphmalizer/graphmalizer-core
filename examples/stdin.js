// Another example

// Usage (or run ./stdin.sh):
//   Add single node:
//     echo '{"type":"node", "id":"a", "dataset": "test"}' | node stdin.js
//   Remove single equivalence:
//     echo '-{"type":"equivalence", "source":"a", "target": "a", "dataset": "test"}' | node stdin.js

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

var Graphmalizer = require('../index');

var G = new Graphmalizer();
G.register(stdin).each(H.log);
