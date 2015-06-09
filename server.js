// HTTP frontend
var R = require('ramda');
var Q = require('kew');
var c = require('chalk');
var u = require('util');
var pp = require('prttty');

var mach = require('mach');
var app = mach.stack();

app.use(mach.logger);
app.use(mach.params);

// standardized answer
var answer = function(mkPromise){
	return function(conn){
		return mkPromise(conn )
			.then(function(data){
				return conn.json(200, {ok: true, data: data})
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

// new doc, generate id
app.post('/:dataset/:type/', U.POST); 

// new doc, specify id
app.post('/:dataset/:type/:id', U.POST);

// update document
app.put('/:dataset/:type/:id', U.PUT);

// delete document
app.delete('/:dataset/:type/:id', U.DELETE);


app.get('/node/neo-id/:id', function(conn){	
	return answer(conn, Graph({
		query: 'START n=node({id}) MATCH (n:_) RETURN e',
		params: {id: parseInt(conn.params.id)}
	}));
});

app.get('/edge/neo-id/:id', function(conn){	
	return answer(conn, Graph({
		query: 'START e=edge({id}) MATCH ()-[e:_]->() RETURN e',
		params: {id: parseInt(conn.params.id)}
	}));
});

mach.serve(app);