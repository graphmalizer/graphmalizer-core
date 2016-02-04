var log = require('./log');
var R = require('ramda');

var http = require('http');

var defaults = {
	hostname: 'localhost',
	port: 7474,
	method: 'POST',
	path: '/db/data/transaction/commit',
	headers: {
		"Accept": 'application/json; charset=UTF-8',
		"Content-Type": 'application/json'
	},
	keepAlive: true
};

var ns_time = function(){
	var t  = process.hrtime();
	return t[0] * 1e9 + t[1];
};

/*
   statements a list of
   [ { statement: q.query,
       parameters: q.params }, ... ]
*/

module.exports = function(options) {
	var opts = R.merge(defaults, options || {});

	return function batchCommit(statements, callback) {

		var s = JSON.stringify({statements: statements});

		// get timestamp and convert to nanoseconds
		var t0 = ns_time();

		// response
		var result = '';

		var req = http.request(opts, function(res) {
			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				log("data");
				result += chunk;
			});

			res.on('end', function() {
				log("recv end", result.length);

				// parse accumulated response
				var resp = {};

				// convert nanoseconds to milliseconds
				var t1 = ns_time();
				resp.duration_ms = (t1 - t0) / 1e6;

				// store
				resp.statusCode = res.statusCode;

				try {
					// try to parse the result, should be JSON
					var r = JSON.parse(result);

					if(r.errors)
						resp.errors = r.errors;

					// convert to more compact JSON representation
					var rdict = unwrapResult(r);

					// store it
					resp.results = rdict;
				}
				catch(e)
				{
					log('failed parsing result')
					resp.error = e.stack;

					// give some hint
					if(res.statusCode === 401)
						resp.errorHint = 'Got 401 Not Authorized, see README.md on authentication';
				}

				log("size", result.length);

				// parsing duration
				var t2 = ns_time();
				resp.parse_ms = (t2 - t1) / 1e6;

				// let caller know (or error)
				callback(null, resp);
			})
		});

		req.on('error', function(err) {
			log("RECEIVED error EVENT");
			callback(err, null);
		});

		// write data to request body
		log("writing");
		req.write(s);

		log("send end");
		req.end();
	};
};

/*

 this function converts this:

	results: [
		{
			columns: ["n"]
			, data: [
			{
				row: [
					{
						id: "a"
						, dataset: "stdin"
						, accessTime: 1437955066039
						, counter: 1
					}
				]
			}]
		}]

 to this:

	[{
		n: {
			id: "a"
			, dataset: "stdin"
			, accessTime: 1437955066039
			, counter: 1
		}
	}]

*/
function unwrapResult(x){
	// create dictionary for each row
	// {columnName: row[ columnIndex ]}
	return x.results.map(function(entry){
		return entry.data.map(function(d){
			return entry.columns.reduce(function(acc, n, i){
				acc[n] = d.row[i];
				return acc;
			}, {});
		});
	});
}

