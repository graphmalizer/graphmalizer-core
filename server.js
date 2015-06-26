// HTTP frontend
var R = require('ramda');
var Q = require('kew');
var c = require('chalk');
var u = require('util');
var pp = require('prttty');

var mach = require('mach');
var app = mach.stack();

// app.use(mach.logger);
app.use(mach.params);

// standardized answer
var answer = function(mkPromise){
	return function(conn){
		console.log(c.magenta("REQ"), '=>', pp.render(conn.params));
		
		// get timestamp
		var t0  = process.hrtime();

		return mkPromise(conn)
			.then(function(data){
				// find elapsed time in nanoseconds
		  		var dt = process.hrtime(t0);
				var ns = dt[0] * 1e9 + dt[1];
				return conn.json(200, {
					ok: true,
					data: data,
					duration_ms: (ns / 1e6),
					duration_seconds: (ns / 1e9)
				})
			})
			.fail(function(err) {
				console.error(c.red('ERR'), c.grey('=>'), err);
				return conn.json(500, {ok: false,
					error: err.message,
					stacktrace: err.stack.split(/\n\s*/)
				})
			});
	}
}

app.get('/', function (conn) {
	return conn.json(200, {ok: true});
});

// load resources, generate standardized answer
var U = R.mapObj(answer, require('./resources'));

// run arbitrary cypher queries
app.get('//query/:query_name', U.cypher);
app.get('//query/', U.list_queries);
app.get('//query', U.list_queries);

// new doc, generate id
app.post('/:dataset/:type/', U.POST); 
app.post('/:dataset/:type', U.POST); 

// new doc, specify id
app.post('/:dataset/:type/*', U.POST);

// update document
app.put('/:dataset/:type/*', U.PUT);

// delete document
app.delete('/:dataset/:type/*', U.DELETE);


mach.serve(app);