var R = require('ramda')
var H = require('highland')
var permutator = require('./permutations.js')

// take a list of instructions without an `operation` field
// then turns it into 'add add add .. ... remove remove remove'

function forceOperation (operation) {
  return R.map(R.assoc('operation', operation))
}

var ensureAdd = forceOperation('add')
var ensureRemove = forceOperation('remove')

// add and remove items in content
function prepare (content) {
  return R.concat(ensureAdd(content), ensureRemove(content))
}

function allVariants (content) {
  // start with 1 element and increment
  var sizes = R.range(1, R.length(content) + 1)

  return H(sizes)
    // for each length, map to all permutations of it
    .flatMap(function (n) {
      // turn first `n` items from content into adds and removes
      return H(prepare(R.take(n, content)))
        .pipe(permutator())
    })
}

// given a list of 'add' operations, this thing returns a stream of all
// possible variations of constructing and destructing the graph from this
// including all possible subgraphs (1 document, 2 documents, 3 documents, ...)
module.exports = allVariants
