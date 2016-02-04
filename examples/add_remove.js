// example

var R = require('ramda')
var H = require('highland')

var graphmalizer = require('./index')

var ensureAdd = R.assoc('operation', 'add')
var ensureRemove = R.assoc('operation', 'remove')

// the stream that we will be registering with the graphmalizer
var addRemoveStream = H()

exports.add = function (thing) {
  addRemoveStream.write(ensureAdd(thing))
}

exports.remove = function (thing) {
  addRemoveStream.write(ensureRemove(thing))
}

// register our stream
graphmalizer(addRemoveStream)
  .each(H.log)
