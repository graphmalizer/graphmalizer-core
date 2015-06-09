
# Datamodel

## Input

	/:dataset/:type/:id

- Dataset (`bag.cities.nl`)
- Type (`PIT`)
- Identifiers (`x/a`)

Datasets have a root name, simply `rootname.subname1.subname2`.

Identifiers without *x*, (so `a`, no slash) are expanded to `x/a`
with *x* the current dataset rootname.

Note: We could prefix every ES index/type and every Neo label to
provide multi-tenancy or to avoid global scope pollution. This is left out for brevity.

## Mapping to ES

- Index = Dataset name
- Type = type name
- ES id = expanded datum id

## Mapping to Neo4j

Every node/edge gets a label `:_` and a *glui*, Graph label-unique identifier.

	CREATE CONSTRAINT ON (n:_) ASSERT n.glui IS UNIQUE

- Index = label `:I_DATASETNAME`
- Type = label `:T_TYPENAME`
- Neo ID = property {glui: {expanded datum id}}

# Graph

In order to create an edge between two non-existing nodes, we insert 'ghost' nodes.
We use the following notation:

	 x     ~ no node
	( )    ~ ghost node
	(-)    ~ inhabited node

We want to maintain an invariant, namely that at all times, there are no ghost nodes with *degree 0*.

	--( )	~ fine, has some edge
	  ( )	~ not allowed!

## Nodes

You can create, update or remove a node. Each node has an identifier.

### Create Node

	POST /foo.bar/baz-node/123

	x							201 (:INHAB {id:'foo/123' ...})
	({id:'foo/123'})			200 (:INHAB {...})
	(:INHAB {id:'foo/123'})		403 // forbidden

### Update Node

	PUT /foo.bar/baz-node/123

	x							404 // not found
	({id:'foo/123'})			404 // not found
	(:INHAB {id:'foo/123'}) 	200 (:INHAB {id:'foo/123' ...})	

### Delete Node

	DELETE /foo.bar/baz-node/123

	x							404 // not found
	({id:'foo/123'})			404 // not found
	(:INHAB {id:'foo/123'}) 	200 x


## Edges

Edges, like nodes, must be given an identifier.

However, if you don't have identifiers for your edge datums,
we will infer an identifier. Namely, we combine

 - source `x/a`
 - target `y/b`
 - type
 - dataset

into the edge-identifier.

In this case, for each dataset and each type, you can have at most one edge between each node.

### Create Edge

	POST /foo.bar/baz-edge/123

Pass two parameters:

- source = `a` | `x/a`
- target = `b` | `y/b`

look for two nodes `({id:'x/a'})`,`({id:'y/b'})

Create both sides and the edge inbetween:

	 x   x			({id:'x/a'}) -> ({id:'y/b'})

Create either source or target and the edge inbetween:

	( )  x			( ) -> ({id:'y/b'})
	(-)  x			(-) -> ({id:'y/b'})
	 x  ( )			({id:'x/a'}) -> ( )
	 x  (-)			({id:'x/a'}) -> (-)

Just create the edge:

	( ) ( )			( ) -> ( )
	(-)	( )			(-) -> ( )
	( ) (-)			( ) -> (-)
	(-) (-)			(-) -> (-)

### Update Edge

	PUT /foo.bar/baz-edge/:id

look for two nodes `({id:'x/a'})`,`({id:'y/b'})

	 x   x			404
	( )  x			404
	(-)  x			404
	 x  ( )			404
	 x  (-)			404

Edge cannot be found

	( ) ( )			404
	(-)	( )			404
	( ) (-)			404
	(-) (-)			404

Edge cannot be found

	( )-->( )			( ) -> ( )
	(-)-->( )			(-) -> ( )
	( )-->(-)			( ) -> (-)
	(-)-->(-)			(-) -> (-)

### Delete Edge

	DELETE /foo.bar/baz-edge/:id

look for edge identified by two nodes `({id:'x/a'})` `({id:'y/b'}) (plus relevant dataset/type)

We now write `--( )` to indicate a node with *degree strictly greater than 1*.

Cannot find one of the nodes:

	   x     x			404
	   x    ( )         404
	  ( )    x			404
	   x    (-)         404
	  (-)    x			404

Found the nodes, but no edge with the right id.

	  ( )   ( )			404
	  (-)   ( )			404
	  ( )   (-)			404
	  (-)   (-)			404

Remove just edge

	--( )-->( )--       --( )   ( )--
	--(-)-->( )--       --( )   ( )--
	--(-)-->(-)--       --( )   ( )--
	--( )-->(-)--       --( )   ( )--

Remove edge and not inhabited nodes.

	  ( )-->( )--          x    ( )--
	  ( )-->(-)--          x    (-)--
	  (-)-->( )--         (-)   ( )--
	  (-)-->(-)--         (-)   (-)--

	--( )-->( )         --( )    x
	--(-)-->( )         --(-)    x
	--( )-->(-)         --( )   (-)
	--(-)-->(-)         --(-)   (-)

	  ( )-->( )            x     x
	  ( )-->(-)            x    (-)
	  (-)-->( )           (-)    x
	  (-)-->(-)           (-)   (-)
