var http = require('http')
var url = require('url')

var opts = {
	port: 7474,
	method: 'POST',
	path: '/db/data/transaction/commit',
	headers: {
		"Accept": 'application/json; charset=UTF-8',
		"Content-Type": 'application/json'
	},
	auth: 'neo4j:waag',
	keepAlive: true
};

var ns_time = function(){
	var t  = process.hrtime();
	return t[0] * 1e9 + t[1];
}

module.exports = function batchCommit(queries, callback){

	// get timestamp and convert to nanoseconds
	var t0 = ns_time();

	// response
	var result = '';

	var req = http.request(opts, function(res){
	   console.log('STATUS: ' + res.statusCode);
	   console.log('HEADERS: ' + JSON.stringify(res.headers));
	   res.setEncoding('utf8');

	   res.on('data', function (chunk) {
			result += chunk;
	   });

		res.on('end', function() {
			// parse accumulated response
			var resp = JSON.parse(result);

			// convert nanoseconds to milliseconds
			resp.duration_ms = (ns_time() - t0) / 1e6;

			// let caller know
			callback(resp);
		})
	})

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// build request body
	var body = {statements: []};
	queries.forEach(function(q){
		body.statements.push({
			statement: q.query,
			parameters: q.params
		})
	});

	// write data to request body
	req.write(JSON.stringify(body));
	req.end();
}