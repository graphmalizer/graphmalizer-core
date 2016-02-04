var u = require('util')
var R = require('ramda')
var hashOf = require('./utils/hashOf')

var requireSourceTarget = function (input) {
  // must have source and target
  if (!(input.source && input.target))
    throw new Error(u.format("Type '%s' has %s structure and thus requires `source` and `target` fields.", input.type, input.structure))

  // if we have no id, generate one using hash of s,type,t
  return input.id || hashOf([input.source, input.type, input.target])
}

var requireId = function (input) {
  if (!input.id)
    throw new Error(u.format("Type '%s' has %s structure and requires the `id` field", input.type, input.structure))

  return input.id
}

// we define how identifiers are created for each structure here
var ensureIdentifier = {
  node: requireId,
  arc: requireSourceTarget,
  equivalence: requireSourceTarget
}

module.exports = function (types) {
  // for faster error reporting
  var typeNames = Object.keys(types).join(' ')
  // and type to structure name lookup
  var structureNames = R.mapObj(R.compose(R.head, Object.keys), types)

  return function prepareInput (input) {
    // default operation is add
    input.operation = input.operation || 'add'

    // s, t alias for source/target
    input.source = input.source || input.s
    input.target = input.target || input.t

    // ensure (empty) data field
    input.data = input.data || {}

    // queries are exceptional!
    if (input.query) {
      // pretend they are operations on `query` structure
      input.structure = 'query'
      input.operation = input.query

      // and bypass further checks
      return input
    }

    // must pass a dataset
    if (!input.dataset)
      throw new Error('Input has to have a dataset field')

    // for normal documents, everything starts with a type
    if (!input.type)
      throw new Error('Input has to have a type field')

    // it has to be defined in the config
    if (!types[input.type])
      throw new Error(u.format('Unknown type "%s", must be one of: %s', input.type, typeNames))

    // set structure name
    input.structure = structureNames[input.type]

    // compute id if missing
    input.id = ensureIdentifier[input.structure](input)

    return input
  }
}
