
some sort of graphmalizer, take sets of documents into elasticsearch and neo.

see [ABOUT](ABOUT.md)


[typedefs](conf/typedefs.js)

```
exports.PIT = {
	node: {
		id: 'hgId'
	}
}

exports.LIES_IN = {
	edge: {
		source: 'from',
		target: 'to'
	}
}
```

mapping to ES, Neo


```
------------------------------
dataset:  bag.nl.straten
type:     LIES_IN
id:       null
document:
  from: 2345
  to:   foo/234
------------------------------
ES:
  index: bag
  type:  LIES_IN
  id:    bag/bag.2345--LIES_IN--foo.234
Neo:
  labels:
    - T_LIES_IN
    - I_bag.nl.straten
    - __
  id:     bag/bag.2345--LIES_IN--foo.234
  source: bag/2345
  target: foo/234


------------------------------
dataset:  bag.nl.straten
type:     LIES_IN
id:       123
document:
  from: 2345
  to:   foo/234
------------------------------
ES:
  index: bag
  type:  LIES_IN
  id:    bag/123
Neo:
  labels:
    - T_LIES_IN
    - I_bag.nl.straten
    - __
  id:     bag/123
  source: bag/2345
  target: foo/234


------------------------------
dataset:  bag.nl.straten
type:     PIT
id:       123
document:
  a: 2345
------------------------------
ES:
  index: bag
  type:  PIT
  id:    bag/123
Neo:
  labels:
    - T_PIT
    - I_bag.nl.straten
    - __
  id:     bag/123
```
