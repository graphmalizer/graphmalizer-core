var argv = require('minimist')(process.argv.slice(2));

if(argv.redis)
	require("./core/redis")
else
	require("./core/server")