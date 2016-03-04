
var graphCheck = require('../utils/graphCheck.js')
/*
var g1 = [[1,2],[2,3],[1,3]]
var g2 = [[{a:4},3],[{a:4},21],[21,3]]
console.log(graphCheck(g1, g2))

broketh.

  [:find ?n[object Object] ?n3 ?n[object Object] ?n21 ?e1 ?e2 ?e3 :in $
  :where
  [?e1 "s" ?n[object Object]] [?e1 "t" ?n3]  [?e2 "s" ?n[object Object]]
  [?e2 "t" ?n21]  [?e3 "s" ?n21] [?e3 "t" ?n3] ]
*/

var g1 = [
  [1, 2],
  [2, 3],
  [1, 3]
]

var g2 = [
  [4, 3],
  [4, 21],
  [21, 3]
]

console.log(graphCheck(g1, g2))
