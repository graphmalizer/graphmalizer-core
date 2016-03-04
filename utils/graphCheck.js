var ds = require('datascript')
var R = require('ramda')

// input: list of edge (source, target) node id's [ [n1, n2], ... ]
var empty = ds.empty_db()

function mkDB (edges) {
  var content = edges.map(function (edge, idx) {
    var s = edge[0]
    var t = edge[1]
    return { ':db/id': idx + 1, s: -s, t: -t }
  })
  return ds.db_with(empty, content)
}

function mkQuery (edges) {
  // ?n1 ?n2 ...
  var nstr = R.compose(
    R.join(' '),
    R.map(n => `?n${n}`),
    R.uniq,
    R.flatten
  )(edges)

  // ?e1 ?e2 ...
  var estr = R.compose(
    R.join(' '),
    R.mapIndexed((edge, i) => `?e${i + 1}`)
  )(edges)

  // [?e1 "s" ?n1] [?e1 "t" ?n2] ...
  var topostr = R.compose(
    R.join(' '),
    R.mapIndexed(function (edge, idx) {
      var s = edge[0]
      var t = edge[1]
      var i = idx + 1
      return `[?e${i} "s" ?n${s}] [?e${i} "t" ?n${t}] `
    })
  )(edges)
  return `[:find ${nstr} ${estr} :in $ :where ${topostr}]`
}

// this trick only works because we use negative nrs for nodes
// TODO still wondering if I'm checking everything though... prob. not
function isPermutation (assignment) {
  return R.eq(R.length(R.uniq(assignment)), R.length(assignment))
}

/** usage:
var graphCheck = require('graphcheck')
var g1 = [[1,2],[2,3],[1,3]]
var g2 = [[4,3],[4,21],[21,3]]
graphCheck(g1, g2) // => true
*/
module.exports = function similarGraph (edges_graph1, edges_graph2) {
  var db = mkDB(edges_graph1)
  var q = mkQuery(edges_graph2)
  console.log(q)
  // we consider the graphs similar if we can find at least one assigment
  // without overlap
  var assigments =
    R.compose(
      R.forEach(r => console.log('Match:', r)),
      R.filter(isPermutation)
    )(ds.q(q, db))

  return R.length(assigments) > 0
}
