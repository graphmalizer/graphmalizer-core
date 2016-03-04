var ds = require('datascript')
var R = require('ramda')

var inSet = R.flip(R.containsWith(R.eqDeep))

function eq_set (s1, s2) {
  var s1_sub_s2 = R.all(inSet(s2), s1)
  var s2_sub_s1 = R.all(inSet(s1), s2)
  return R.and(s1_sub_s2, s2_sub_s1)
}

/* such that:

    > eq_set([1,{a:2},3],[{a:2},1,3])
    true
    > eq_set([1,2,3],[2,1,3])
    true

*/

var failures = 0
var asserts = 0
var errors = 0

function assert_eq_set (expected, got, message) {
  asserts++
  if (!eq_set(expected, got)) {
    errors--
    failures++
    var s = (message || 'Assertion failed') + ': expected: ' + JSON.stringify(expected) + ', got: ' + JSON.stringify(got)
    throw new Error(s)
  }
}

function test_db_with () {
  // empty database
  var db = ds.empty_db({'age': {':db/index': true}})

  // add people
  var people_db = ds.db_with(db, [
    { ':db/id': 1, 'name': 'Ivan', 'age': 15 },
    { ':db/id': 2, 'name': 'Petr', 'age': 37 },
    { ':db/id': 3, 'name': 'Ivan', 'age': 37 }
  ])

  var res = ds.q('[:find ?e :in $ ?adult :where [?e "age" ?a] [(?adult ?a)]]',
                people_db,
                function (a) { return a > 18 })
  console.log(res)
  assert_eq_set([[2], [3]], res)
}

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

  var isIso = function (q, db) {
    var assigments =
      R.compose(
        R.forEach(r => console.log('Match:', r)),
        R.filter(isPermutation)
      )(ds.q(q, db))
    return R.length(assigments) > 0
  }

  console.log('graph 1 (not isomorphic): isIso?=', isIso(q, not_iso))
  console.log('graph 2 (isomorphic): isIso?=', isIso(q, iso))
}

test_db_with()
test_db_with2()

console.log(`fails ${failures} asserts ${asserts} errors ${errors}`)
