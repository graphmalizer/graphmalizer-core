// this tests wether a graph is empty after adding and removing everything
var R = require('ramda')
var H = require('highland')
var allVariants = require('../utils/allVariants.js')
var Graphmalizer = require('../index.js')
var test = require('tape').test

function graphContent (node, arc, equiv) {
  return [
    node('A'),
    node('B'),
    node('C'),
    equiv('A', 'B'),
    equiv('B', 'C')
  ]
}

function asGraphmalizeInstructions (contentBuilder) {
  function node (id) {
    return {type: 'node', id: id}
  }
  function arc (s, t) {
    return {type: 'arc', s: s, t: t}
  }
  function equiv (s, t) {
    return {type: 'equivalence', s: s, t: t}
  }
  return contentBuilder(node, arc, equiv)
}

var wrap = R.compose(
  // clean DB before
  R.prepend({query: 'clear'}),

  // and query it after
  R.append({query: 'graph'}),

  // ensure we have a dataset field
  R.map(R.assoc('dataset', 'test'))
)

function testOneVariation (statements, callback) {
  // make and run test
  test('ensure empty graph after adding and removing', function (t) {
    var testScript = wrap(statements)
    // t.plan(testScript.length)
    var rs = []
    // instantiate
    var G = new Graphmalizer({batchTimeout: 10})
    G.register(H(testScript))
      .each(function (x) {
        t.assert(x.response.length === 1, 'we have one row in response')
        // console.log("GGG", x)
        rs.push(x)
      })
      .done(function () {
        console.log('done')

        // compare result
        var graph = R.last(rs)
        var ns = R.length(graph.response[0].nodes)
        var es = R.length(graph.response[0].edges)
        t.equal(ns, 0, 'expecting no nodes in graph')
        t.equal(es, 0, 'expecting no edges in graph')

        console.log('Rq.statements() = ', statements)
        console.log('G.edges() =', graph.response[0].edges)
        console.log('G.nodes() =', graph.response[0].nodes)
        t.end()
        callback(null, graph)
      })
    G.shutdown()
  })
}

function tezt (inst) {
  allVariants(instr)
    .flatMap(H.wrapCallback(testOneVariation))
    .each(function (graph) {
      console.log('DONE')
    })
}
var instr = asGraphmalizeInstructions(graphContent)

tezt(instr)
