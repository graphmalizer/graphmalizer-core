// takes operations and outputs stream of permutated operations
// takes separate permutations of adds and removes

var R = require('ramda')
var H = require('highland')
var Combinatorics = require('js-combinatorics')

// save version of Combinatorics.cartesianProduct
function cart (xs, ys) {
  // nothing on the left
  if (!xs || xs.length === 0) {
    return ys.map(function (y) {
      return [[], y]
    })
  }

  // nothing on the right
  if (!ys || ys.length === 0) {
    return xs.map(function (x) {
      return [x, []]
    })
  }

  return Combinatorics.cartesianProduct(xs, ys).toArray()
}

module.exports = function () {
  return H.pipeline(
    H.collect(),
    H.consume(function (err, x, push, next) {
      if (err) {
        // pass errors along the stream and consume next value
        push(err)
        next()
      }
      else if (x === H.nil) {
        // pass nil (end event) along the stream
        push(null, x)
      } else {
        // first do all add, then all removes
        var things = R.groupBy(R.propOr('add', 'operation'), x)

        // create all permutations of adds and removes separately
        var perms = R.mapObj(function (xs) {
          return Combinatorics.permutation(xs).toArray()
        }, things)

        // take product [adds] ++ [removes]
        var cp = cart(perms['add'], perms['remove'])

        // for each combination, push out concatenated list again
        cp.forEach(function (c) {
          push(null, R.concat(c[0], c[1]))
        })

        // done
        next()
      }
    })
  )
}
