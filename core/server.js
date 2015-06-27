// HTTP frontend
var R = require('ramda');
var Q = require('kew');
var log = require('../utils/log');

var mach = require('mach');
var app = mach.stack();

// app.use(mach.logger);
app.use(mach.params);

// standardized answer
var mkStandardAnswer = function(mkPromise){
	return function(conn) {
		log.REQ(conn.params);
		
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
				log.ERR(err);
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

var r = require('./resources');

// load resources, generate standardized answer
var U = R.mapObj(mkStandardAnswer, {
	add: r.modifyDocument('add'),
	update: r.modifyDocument('update'),
	remove: r.modifyDocument('remove'),
	queries: r.queries,
	query: r.query
});

// new doc, generate id
app.post('/:dataset/:type/', U.add); 
app.post('/:dataset/:type', U.add); 
app.post('/:dataset/:type/*', U.add);

app.put('/:dataset/:type/', U.update);
app.put('/:dataset/:type', U.update);
app.put('/:dataset/:type/*', U.update);

// delete document
app.delete('/:dataset/:type/', U.remove);
app.delete('/:dataset/:type', U.remove);
app.delete('/:dataset/:type/*', U.remove);

// run arbitrary cypher queries
app.get('//query/:query_name', U.query);
app.get('//query/', U.queries);
app.get('//query', U.queries);
app.get('//queries/', U.queries);
app.get('//queries', U.queries);

mach.serve(app);