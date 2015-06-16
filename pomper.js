var fs = require('fs');
var c = require('chalk');
var redis = require('redis');
var glob = require("glob")
var readline = require('readline');
var argv = require('minimist')(process.argv.slice(2));

var queueName = argv.q || argv.queue;
if(argv._.length < 1 || !queueName) {
	console.log("usage: node ./pomper.js --queue 'name' [filename.ndjson ..]");
	process.exit(-1);
}

var client = redis.createClient();

argv._.forEach(function(pattern){
	glob(pattern, function (err, files) {
		if(err){
			console.log(err);
			process.exit(-1);
		}

		files.forEach(function(filename){
			console.log(filename);

			var rd = readline.createInterface({
			    input: fs.createReadStream(filename),
			    output: process.stdout,
			    terminal: false
			});

			rd.on('line', function(line) {
				var d = JSON.stringify(JSON.parse(line));
				client.rpush(queueName, d, function(err,data){
					if(err) {
						console.error(c.red(err.message), err.stack);
						process.exit(-1);
					}
					if(data % 1000 === 0)
						console.log(c.yellow('qsize'),'=>', c.bold(data));
				});
			});
		});
	});
});
