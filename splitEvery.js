var R = require('ramda');

// HACK, waiting for https://github.com/ramda/ramda/pull/1050

/*

  Usage:

	  var splitEvery = require('./splitevery');

	  splitEvery(2)([1,2,3,4,5]) //=> [ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]

*/

module.exports = function(n)
{
	return R.compose(

		// remove empty arrays
		R.filter(function(a){
			return a.length != 0;
		}),
	
		// split into arrays of size n
		// e.g. n=2 ~> [1,2,3,4,5] => [1,2],[],[3,4],[],[5]
		function(array) {
			return array.map(
				function(x, i) {
			        if (i % n === 0)
			            return array.slice(i, i + n);
					else
						return []
				}
			);
		}
	);
}