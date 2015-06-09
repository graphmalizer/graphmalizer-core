---
label: add_node
description: Add a node
---

MERGE (n:PIT)	
WHERE n.hgId='foo'

---
label: remove_node
description: Remove a node
---

MATCH (n), (m)
WHERE n.hgId = '123'
  AND m.hgId = '234'
