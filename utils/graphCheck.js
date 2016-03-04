var ds = require('datascript')
var R = require('ramda')

var inSet = R.flip(R.containsWith(R.eqDeep))

function eq_set (s1, s2) {
  var s1_sub_s2 = R.all(inSet(s2), s1)
  var s2_sub_s1 = R.all(inSet(s1), s2)
  return R.and(s1_sub_s2, s2_sub_s1)
}

function isIso (q, db) {
  var assigments =
    R.compose(
      R.forEach(r => console.log('Match:', r)),
      R.filter(isPermutation)
    )(ds.q(q, db))
  return R.length(assigments) > 0
}



}

function test_db_with () {
  ])
// this trick only works because we use negative nrs for nodes
// TODO still wondering if I'm checking everything though... prob. not
function isPermutation (assignment) {
  return R.eq(R.length(R.uniq(assignment)), R.length(assignment))
}

function test_db_with2 () {
  // empty database
  var db = ds.empty_db({'age': {':db/index': true}})

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
