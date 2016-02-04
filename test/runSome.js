// runs some tests
var Graphmalizer = require('../index')
var H = require('highland')
var R = require('ramda')
var u = require('util')

// test anything protocol
var test = require('tape').test

// load tests from file
var fs = require('fs')
var yaml = require('js-yaml')
var fn = require('path').join(__dirname, 'runSome.yaml')
var f = fs.readFileSync(fn, {encoding: 'utf8'})
var spec = yaml.safeLoad(f, {filename: fn})

// permutation stream
var permutator = require('../utils/permutations')

function runOne (tname, statements) {
  // make and run test
  test(tname, function (t) {
    t.plan(statements.length)

    var rs = []

    // instantiate
    var G = new Graphmalizer({batchTimeout: 10})
    G.register(H(statements))
      .each(function (x) {
        t.assert(x.response.length === 1, 'we have one row in response')
        rs.push(x)
      })
      .done(function () {
        console.log('done')

        // compare result
        var graph = R.last(rs)
        console.log(graph)

        t.end()
      })
  })
}

var wrap = R.compose(
  // clean DB before
  R.prepend({query: 'clear'}),

  // and query it after
  R.append({query: 'graph'}),

  // ensure we have a dataset field
  R.map(R.assoc('dataset', 'test'))
)

function runPermutations (tname, statements) {
  console.log('b', tname, statements)
  var iteration = 0
  H(statements)
    .pipe(permutator())
    .fork()
    .each(function (xs) {
      // clear -> [statements] -> query
      var ss = wrap(xs)

      // generate a test name for this iteration
      var n = u.format('%s-%d', tname, iteration++)

      runOne(n, ss)
    })
}

for (var tname in spec)
  runPermutations(tname, spec[tname].operations)
