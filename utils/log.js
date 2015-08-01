// this should do until we get real log system
var argv = require('minimist')(process.argv.slice(2));
module.exports = argv.stfu ? function(){} : console.log.bind(console);
