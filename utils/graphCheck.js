var ds = require('datascript')
var R = require('ramda')

// this trick only works because we use negative nrs for nodes
// TODO still wondering if I'm checking everything though... prob. not
function isPermutation (assignment) {
  return R.eq(R.length(R.uniq(assignment)), R.length(assignment))
}

function isIso (q, db) {
  var assigments =
    R.compose(
      R.forEach(r => console.log('Match:', r)),
      R.filter(isPermutation)
    )(ds.q(q, db))
  return R.length(assigments) > 0
}

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

function test_db_with () {
  var db1 = mkDB([
    [1, 2],
    [2, 3],
    [3, 4]
  ])
  var db2 = mkDB([
    [1, 2],
    [2, 3],
    [2, 4]
  ])
  var q = mkQuery([
    [1, 2],
    [2, 3],
    [2, 4]
  ])
  console.log(q)
  console.log('graph 1 isIso? = ', isIso(q, db1))
  console.log('graph 2 isIso? = ', isIso(q, db2))
}

function test_db_with2 () {
  // empty database
  var db = ds.empty_db()

  // add edges, use negative nrs for the nodes
  // this is so that we can `R.uniq` the set and check
  // that we have no duplicate assigments
  var not_iso = ds.db_with(db, [
    { ':db/id': 1, s: -1, t: -2 },
    { ':db/id': 2, s: -2, t: -3 },
    { ':db/id': 3, s: -3, t: -4 }
  ])

  var iso = ds.db_with(db, [
    { ':db/id': 1, s: -1, t: -2 },
    { ':db/id': 2, s: -2, t: -3 },
    { ':db/id': 3, s: -2, t: -4 }
  ])

  var q = '[:find ?n1 ?n2 ?n3 ?n4 ?e1 ?e2 ?e3 :in $ :where ' +
      '[?e1 "s" ?n1] [?e1 "t" ?n2]' +
      '[?e2 "s" ?n2] [?e2 "t" ?n3]' +
      '[?e3 "s" ?n2] [?e3 "t" ?n4] ]'

  console.log('graph 1 (not isomorphic): isIso?=', isIso(q, not_iso))
  console.log('graph 2 (isomorphic): isIso?=', isIso(q, iso))
}

test_db_with()
test_db_with2()
