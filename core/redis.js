// HTTP frontend
var R = require('ramda');
var Q = require('kew');
var log = require('../utils/log');

// any string is converted to URI
var normalizeIdentifiers = require('histograph-uri-normalizer').normalize;

function toGraphmalizer(msg, flip)
{
	function norm(x)
	{
		if(x)
			return normalizeIdentifiers(x, msg.sourceid);
		return undefined;
	};

	var d = msg.data;

	return {
		method: {add: "POST", delete: "DELETE", update: "PUT"}[msg.action],
		params: {
			// TODO fix graphmalizer HTTP daemon to accept '.' in datasetname
			dataset: msg.sourceid.replace('.','-'),

			// some old data uses `label` instead of `type`
			type: d.type || d.label,

			// nodes are identified with id's or URI's, we don't care
			id: norm(d.id || d.uri),

			// formalize source/target id's
			source: (flip && norm(d.to)) || norm(d.from),
			target: (flip && norm(d.from)) || norm(d.to)
		}
	}
}

var r = require('./resources');
var u = require('./slurper');

// 	add: r.modifyDocument('add'),
// 	update: r.modifyDocument('update'),
// 	remove: r.modifyDocument('remove'),
// 	queries: r.queries,
// 	query: r.query

u.loopRedis(function(msg){

	var conn_mock = toGraphmalizer(msg, false);

	// convert objects into strings (Neo4J cannot object)
	var doc = (msg.data && u.stringifyObjectFields(msg.data)) || {}
	conn_mock.params.doc = doc;

	var op = {add: "add", delete: "remove", update: "update"}[msg.action]
	var p = r.modifyDocument(op)(conn_mock);
	// console.log(p)
	
	// add opposite edge as well
	if(msg.type === 'hg:sameHgConcept')
	{
		// add flipped edge, a <- b
		p = p.then(function(){
			console.log('BIDIR')
			var m2 = toGraphmalizer(msg, true);
			m2.params.doc = doc;
			return r.modifyDocument(op)(m2);
		});
	}

	return p;

	// // index into elasticsearch
	// return p.then(function(){
	// 		// put unprocessed document
	// 		x.doc = msg.data || {}
	// 		return u.putElastic(x);
	// 	})
});

