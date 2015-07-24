var _ = require('highland');

var graphmalizer = require('./core/stream');

// TODO somehow multiplex / demultiplex streams.. not sure
// want to return some response

// stream of input streams
var streams = _();

// processing pipeline
var system = streams
	.merge()
	.pipe(graphmalizer)
	.each(function(){
		console.log('~_~_~_~_~ request finished ~_~_~_~_~');
	});

// api, just give us a input stream
module.exports = function(stream) {
	if(!_.isStream(stream))
		throw new Error("Must pass a (highland) stream");

	streams.write(stream);

	// so that you can look at it
	return system.observe();
};

