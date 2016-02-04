[![wercker status](https://app.wercker.com/status/7c2c4cd1b96c26872d7f98c3816c8f76/s/master "wercker status")](https://app.wercker.com/project/bykey/7c2c4cd1b96c26872d7f98c3816c8f76)

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

# Neo4J

## Installation on OSX

[Homebrew](http://brew.sh/) does the trick.

	brew install --devel neo4j
	neo4j start

## Authorization

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

## Development

You can also use the [`wercker` commandline interface](http://wercker.com/cli/).

Setup docker host (automatically starts it) or just start it if you
have done this before (check with `docker-machine ls`).

    docker-machine create -d virtualbox graphmalizer
    docker-machine start graphmalizer

Then you want to update your shell so I knows about the docker host.

    eval $(docker-machine env graphmalizer) # bash
    eval (docker-machine env graphmalizer)  # fish

Now you can build and test using wercker:

    wercker build

# Examples

See [`examples/`](examples/)
