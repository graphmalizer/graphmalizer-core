#! /bin/sh

neo4j-shell -c "MATCH n OPTIONAL MATCH n-[e]-() DELETE e, n RETURN DISTINCT true;"

cat test2.ndjson | node newz.js

