---
name: add_node
description: Add a node
---
MERGE (n:_ {id: {id}})	
RETURN n

---
name: remove_node
description: Remove a node
---

MATCH (n), (m)
WHERE n.hgId = '123'
  AND m.hgId = '234'

---
name: add_edge
description: Remove a node
---

MATCH (n {id: {source}}), (m {id: {target}})
CREATE (n)-[e:_]->(m)
RETURN e
