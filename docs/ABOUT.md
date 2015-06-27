
# Datamodel

## Input

	/:dataset/:type(/:id)
	- source: id
	- target: id

- Dataset (`some-string`)
- Type (`PIT`)
- Identifiers (`abc123`)

### Types and structures

A **structure** in the graph is a node or edge.

They define the a central part of the graphmalizer core,
[see graph.yaml](../core/graph.yaml).

![node](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/node.svg)*node* 		![edge](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/edge.svg)*edge*

**Types** are the sorts of documents you feed the graphmalizer.

Here are some documents with types `A`, `B`, `C` and
identifiers *012*, *123*, *234*, *345*.

![document](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/document.svg)`A`*012* ![document](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/document.svg)`A`*123* ![document](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/document.svg)`B`*234* ![document](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/document.svg)`C`*234*

#### Configuration

To each type you assign a corresponding structure. Which types are
defined and to which structure they map is defined in [your
configuration](../config.json).

For example:

![document](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/document.svg)`A` ~ ![node](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/node.svg)*node*

![document](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/document.svg)`B` ~ ![node](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/node.svg)*node*

![document](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/document.svg)`C` ~ ![node](https://cdn.rawgit.com/graphmalizer/prototype/bb05daee8af3dfb3b22552bb3958b5cdab4c9ff0/docs/edge.svg)*edge*

Given this association, updating a document of a certain type will in turn update the corresponding
structure in the graph.

For maximum confusion, when no configuration is specified,
the [default types](../core/config.js) are `node` and `edge`.
They *manipulate* nodes and edges in the graph and even
the names are the same, however
types are not the same thing as structures.

### Identifiers

All identifiers must be unique, across all datasets.

Identifiers which are lexicographically equal ("equal as a character string"),
are considered to point to the same structure, otherwise not.

The node structure requires `id`. The edge structure requires `source`,
`target` and will derive `id` from them, if `id` is not specified.

[see typeSpecific.js](../core/typeSpecific.js)

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

	x								201 (:_ {id:'foo/123' ...})
	(:_:_VACANT {id:'foo/123'})		200 (:_ {...})
	(:_ {id:'foo/123'})				403 // forbidden

### Update Node

	PUT /foo.bar/baz-node/123

	x								404 // not found
	(:_:_VACANT {id:'foo/123'})		404 // not found
	(:_ {id:'foo/123'}) 			200 (:_ {id:'foo/123' ...})	

### Delete Node

	DELETE /foo.bar/baz-node/123

	x								404 // not found
	(:_:_VACANT {id:'foo/123'})		404 // not found
	(:_ {id:'foo/123'}) 			200 x


## Edges

The edge structure requires `source` and `target` identifiers
and will derive `id` from them, if `id` is not specified.

This implies that if you don't specify an identifier, the edge
is identified by `[source,type,target]` and consequently one
can have only one such edge in your graph.

Put differently, for each type one can have at most two edges
between each node (`s->t`, `t->s`).

### Create Edge

	POST /foo.bar/baz-edge/123

Pass two parameters:

- `source` or `s`, identifier
- `target` or `t`, identifier

This looks for two nodes `(:_ {id: s})`, `(:_ {id: t})`.

Create both sides and the edge inbetween:

	 x   x			(:_ {id: s}) -> (:_ {id: t})

Create either source or target and the edge inbetween:

	( )  x			( ) -> ({id: t})
	(-)  x			(-) -> ({id: t})
	 x  ( )			({id: s}) -> ( )
	 x  (-)			({id: s}) -> (-)

Just create the edge:

	( ) ( )			( ) -> ( )
	(-)	( )			(-) -> ( )
	( ) (-)			( ) -> (-)
	(-) (-)			(-) -> (-)

### Update Edge

	PUT /foo.bar/baz-edge/:id

locate the edge by identifier directly,
either with passed in `id` or derived from `s`,`t` identifier.

`(:_)-[e:_ {id: id}]-(:_)`

If not found, look for two nodes `({id: s})`,`({id: t})`.

	 x   x			404
	( )  x			404
	(-)  x			404
	 x  ( )			404
	 x  (-)			404

Nodes found, but edge cannot be found

	( ) ( )			404
	(-)	( )			404
	( ) (-)			404
	(-) (-)			404

Edge was found, either directly (using some id) or through nodes.

	( )-->( )			( ) -> ( )
	(-)-->( )			(-) -> ( )
	( )-->(-)			( ) -> (-)
	(-)-->(-)			(-) -> (-)

### Delete Edge

	DELETE /foo.bar/baz-edge/:id

Same as update, however,

we now write `--( )` to indicate a node with *degree strictly greater than 1*.

Cannot find one of the nodes:

	 x   x			404
	( )  x			404
	(-)  x			404
	 x  ( )			404
	 x  (-)			404

Nodes found, but edge cannot be found (through id nor nodes)

	( ) ( )			404
	(-)	( )			404
	( ) (-)			404
	(-) (-)			404

Otherwise we found it.

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
