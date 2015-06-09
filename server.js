// HTTP frontend
var Q = require('kew');
var c = require('chalk');
var pp = require('prettyjson');

var mach = require('mach');
var app = mach.stack();

app.use(mach.logger);
app.use(mach.params);

// standardized answer
var answer = function(conn, promise){
	return promise
		.then(function(data){
			return conn.json(200, {ok: true, data: data})
		})
		.fail(function(err) {
			console.error(c.red('ERR'), c.grey('=>'), err);
			return conn.json(500, {ok: false, error: err.message})
		});
}

app.get('/', function (conn) {
	return conn.json(200, {ok: true});
});

var mapping = require('./mapping')

app.post('/:dataset/:type', function(conn){
	var args = conn.params;
	console.log(pp.render(args));
	return answer(conn, Q.fcall(function(){
		return mapping.map(args.dataset, args.type, args.id, args.doc);
	}));
})

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