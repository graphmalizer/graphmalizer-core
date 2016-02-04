// test anything protocol
var test = require('tape').test

var Graphmalizer = require('../index')
var H = require('highland')

// test if graphmalizer starts and terminates
test('terminate without operations', function (t) {
  t.plan(2)
  var G = new Graphmalizer({batchTimeout: 1})
  t.pass('created graphmalizer')
  G.register(H([]))
    .each(function (x) {
      t.fail('should not return anything when nothing is passed in')
    })
    .done(function () {
      t.pass('closed output stream')
      t.end()
    })
  G.shutdown()
})

// test if graphmalizer starts and terminates
test('terminate with operations', function (t) {
  t.plan(3)
  var G = new Graphmalizer({batchTimeout: 1})
  var testNode = {
    dataset: 'test',
    type: 'node',
    id: 'x'
  }
  t.pass('created graphmalizer')
  G.register(H([testNode]))
    .each(function (x) {
      t.pass('returned one result')
    })
    .done(function () {
      t.pass('closed output stream')
      t.end()
    })
  G.shutdown()
})
