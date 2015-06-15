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

---
name: add_node
description: Add a node, fail on existing
# TODO should NOT fail on :_VACANT
ruleset:
- |  x  => (*)
- | ( ) => (*)
- | (*) => 500
---
MERGE (n:_:VACANT {id: {id}})
ON CREATE
SET n = {doc},
	n.created = timestamp(),
	n.id = {id}
ON MATCH
SET n = {doc},
	n.created = timestamp(),
	n.id = {id}
REMOVE n:VACANT
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
description: Remove a node
ruleset:
- |  x  => 404
- | (*) => x
- | --( ) => 404
- | --(*) => --( )
---

MATCH (n:_ {id: {id}})
DELETE n
RETURN true

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
	e.id = id
RETURN *

# cute one
# MATCH (n) MATCH (m) MERGE (n)-[e:_]->(m) RETURN *
# creates labeled edges between all pairs nodes

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
name: get-node
description: >
  Get managed node.
---
MATCH (n:_ {id: {id}}) RETURN n

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
MATCH (n:_),()-[e:_]-() RETURN DISTINCT *

---
name: get-managed-nodes
description: Return all managed nodes and edges
---
MATCH (n:_) RETURN DISTINCT *

---
name: get-managed-edges
description: Return all managed nodes and edges
---
MATCH ()-[e:_]-() RETURN DISTINCT e

---
name: get-adjecent
description: Return all managed nodes and edges
---
MATCH (n:_ {id: {id}})-[e:_]-()
RETURN DISTINCT e

---
name: clean
description: Return all managed nodes and edges
---
MATCH (n:_),()-[e:_]-()
DELETE n, e
RETURN true
