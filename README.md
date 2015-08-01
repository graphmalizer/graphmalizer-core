# Config

You must configure a mapping `type → structure`

```yaml
neo4j:
  host: localhost
  port: 7474
types:
  thing: node
  relation: arc
  equiv: equivalence
```
(in `config.yaml`, `config.json` or `--config [filename.json|filename.yaml]`)

# Input

Input data elements are of this form

```js
{
  dataset: /* string */,
  type: /* what you defined in config */,
  operation: /* 'add' or 'remove' */

  // all optional, depends on the structure
  id: '123',
  s: '123',
  t: '123',

  // whatever you want
  data: { /*...*/ }
}
```

# API

One function, input: stream, output: stream.

Example code

```js
var H = require('highland');
var Graphmalizer = require('graphmalizer-core');

var config = {
	Neo4J: { host: 'localhost', port: 7474 },
	types: {
		thing: { node:{} },
		eats: { arc:{} },
		same: { equivalence: {} }
	}
}

var G = new Graphmalizer(config)

var stream = H([ {type: 'thing', id: 'x'} ]);

G.register(stream)
  .each(H.log);
```

# Neo4J Authorization

Either set `config.Neo4J.auth` to `user:pass`

```js
var G = new Graphmalizer({
	Neo4J: { auth: 'neo4j:neo4j' },
	types: { /* ... */ }
})
```

Or disable HTTP authentication all together, see
[neo4j manual for details](http://neo4j.com/docs/stable/security-server.html#security-server-auth).

Set the following in the *conf/neo4j-server.properties* file and restart server, `neo4j restart`.

```properties
# Disable authorization
dbms.security.auth_enabled=false
```

If you don't know where this file is, you can try `mdfind neo4j-server.properties` on OSX.


# Examples

See [`examples/`](examples/)

