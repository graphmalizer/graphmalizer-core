// create hash from a bunch of things
var crypto = require('crypto');

module.exports = function hashOf(things){
	var shasum = crypto.createHash('sha224');
	things.forEach(function(x){
		shasum.update(x);
	});
	return shasum.digest('base64');
}
