
############################## core queries ###############################

#
#  Below are two sets of three queries,
#
#  - add, update & remove,
#  - for nodes and edges.
#
#  An invariant is maintained, namely
#
#    --( ) vacant nodes only appear with degree > 0
#

#################################### nodes #################################

---
name: add_node
description: Add a node, fail on existing
# TODO should NOT fail on :_VACANT
ruleset:
- |  x  => (*)
- | ( ) => (*)
- | (*) => 500
---
MERGE (n:_:_VACANT {id: {id}})
ON CREATE
	SET n = {doc},
		n.created = timestamp(),
		n.id = {id}
ON MATCH
	SET n = {doc},
	    n.accessTime = timestamp(),
		n.counter = coalesce(n.counter, 0) + 1,
		n.id = {id}
	REMOVE n:_VACANT
RETURN n


---
name: update_node
description: Update a node, fail on non-existing
ruleset:
- |  x  => 404
- | ( ) => (*)
- | (*) => (*)
---
MATCH (n:_ {id: {id}})
WITH n, coalesce(n.counter, 0) + 1 AS c
SET n = {doc},
    n.accessTime = timestamp(),
	n.counter = c,
	n.id = {id}
RETURN n

---
name: remove_node
description: Remove a node or mark vacant.
ruleset:
- |    x  => 404
- | --( ) => 404
- |   (*) => x
- | --(*) => --( )
---
MATCH (n:_ {id: {id}})
WHERE NOT n:_VACANT
	SET n:_VACANT
	SET n={}
	SET n.id = {id}
UNION ALL
OPTIONAL MATCH (n:_:_VACANT {id: {id}})
WHERE length( (n)--() ) = 0
DELETE n
RETURN n

#################################### edges #################################

---
name: add_edge
description: > 
  Add an edge, optionally creating ghost source and targets
ruleset:
- |  x   x  => 404
- | ( )  x   => ( )-->( )
- | (*)  x   => (*)-->( )
- |  x  ( )  => ( )-->( )
- |  x  (*)  => ( )-->(*)
- | ( ) ( )  => ( )-->( )
- | (*) ( )  => (*)-->( )
- | ( ) (*)  => ( )-->(*)
- | (*) (*)  => (*)-->(*)
---

MERGE (s:_ {id: {source}})
ON CREATE SET s :_:_VACANT
MERGE (t:_ {id: {target}})
ON CREATE SET t :_:_VACANT
WITH s,t
MERGE (s)-[e:_ {id: {id}}]->(t)
SET e = {doc},
	e.created = timestamp(),
	e.id = {id}
RETURN *

---
name: update_edge
description: > 
  Remove edge
ruleset:
- |    x     x     =>  404
- |   ( )    x     =>  404
- |   (*)    x     =>  404
- |    x    ( )    =>  404
- |    x    (*)    =>  404
- |   ( )-->( )    =>    ( )-->( )
- |   (*)-->( )    =>    (*)-->( )
- |   ( )-->(*)    =>    ( )-->(*)
- |   (*)-->(*)    =>    (*)-->(*)

---

# find the edge by id
MATCH (s)-[e:_ {id: {id}}]-(t)
WITH e, coalesce(e.counter, 0) + 1 AS c
SET e = {doc},
    e.accessTime = timestamp(),
	e.counter = c,
	e.id = {id}
RETURN e

---
name: remove_edge
description: > 
  Remove edge
ruleset:
- |    x     x     =>  404
- |   ( )    x     =>  404
- |   (*)    x     =>  404
- |    x    ( )    =>  404
- |    x    (*)    =>  404
- |   ( )-->( )    =>     x     x
- |   (*)-->( )    =>    (*)    x
- |   ( )-->(*)    =>     x    (*)
- |   (*)-->(*)    =>    (*)   (*)
- | --( )-->( )--  =>  --( )   ( )--
- | --(*)-->( )--  =>  --(*)   ( )--
- | --( )-->(*)--  =>  --( )   (*)--
- | --(*)-->(*)--  =>  --(*)   (*)--
- |   ( )-->( )--  =>   x    ( )--
- |   (*)-->( )--  =>  (*)   ( )--
- |   ( )-->(*)--  =>   x    (*)--
- |   (*)-->(*)--  =>  (*)   (*)--
- | --( )-->( )    =>  --( )    x
- | --(*)-->( )    =>  --(*)    x
- | --( )-->(*)    =>  --( )   (*)
- | --(*)-->(*)    =>  --(*)   (*)
---

# find the edge by id
MATCH (s)-[e:_ {id: {id}}]-(t)
DELETE e
WITH s.id AS source, t.id AS target

# remove vacant degree zero source and/or target node.
OPTIONAL MATCH (n:_:_VACANT)
WHERE n.id IN [target, source] AND length( (n)-[]-() ) = 0
DELETE n

RETURN true


###########################################################################



---
name: get-node-by-neo-id
description: >
  Get managed node by Neo4J internal id.
---
START n=node({id}) MATCH (n:_) RETURN n

---
name: get-edge-by-neo-id
description: >
  Get managed edge by Neo4J internal id.
---
START e=edge({id}) MATCH ()-[e:_]->() RETURN e

---
name: get-inhabited-node
description: >
  Get inhabited node
---
MATCH (n:_ {id: {id}})
WHERE NOT n:_VACANT
RETURN n

# cute one
# MATCH (n) MATCH (m) MERGE (n)-[e:_]->(m) RETURN *
# creates labeled edges between all pairs nodes

---
name: get-node
description: >
  Get managed node.
---
MATCH (n:_ {id: {id}}) RETURN n

---
name: get-node-labels
description: >
  Get labels for node.
---
MATCH (n:_ {id: {id}})
RETURN labels(n)

---
name: get-edge
description: >
  Get managed edge.
---
MATCH ()-[e:_ {id: {id}}]->() RETURN e

---
name: remove-node
description: >
  Remove managed node, regardless!
  Management operation, destroys invariant.
---
MATCH (n:_ {id: {id}}) DELETE n RETURN true

---
name: remove-edge
description: >
  Get managed edge.
---
MATCH ()-[e:_ {id: {id}}]->() DELETE e RETURN true


---
name: create-schema
description: Create constraints
---
CREATE CONSTRAINT ON (p:_)
       ASSERT p.id IS UNIQUE

---
name: remove-schema
description: Drop constraints
---
DROP CONSTRAINT ON (p:_)
       ASSERT p.id IS UNIQUE

MATCH ()-[e:_]-() DELETE e RETURN *
MATCH (n:_) DELETE n RETURN *

---
name: get-managed-set
description: Return all managed nodes and edges
---
MATCH (n:_),()-[e:_]-()
RETURN DISTINCT *

---
name: get-managed-nodes
description: Return all managed nodes and edges
---
MATCH (n:_)
RETURN DISTINCT *

---
name: get-managed-edges
description: Return all managed nodes and edges
---
MATCH ()-[e:_]-()
RETURN DISTINCT e

---
name: get-adjecent
description: Return all managed nodes and edges
---
MATCH (n:_ {id: {id}})-[e:_]-()
RETURN DISTINCT e


---
name: klont
description: expand under all relations
---

MATCH (x:_ {id: {id}})
	WHERE NOT x:_VACANT
	RETURN x AS n
UNION
	MATCH (x:_ {id: {id}})
	MATCH (x)-[:_*]->(y)
	RETURN DISTINCT y AS n

---
name: clean
description: Return all managed nodes and edges
---
# MATCH (n:_), ()-[e:_]-()
# DELETE e, n
OPTIONAL MATCH ()-[e:_]-()
	DELETE e
	RETURN DISTINCT true AS success
UNION
OPTIONAL MATCH (n:_)
	DELETE n
	RETURN DISTINCT true AS success