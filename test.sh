#! /bin/sh

neo4j-shell -c "MATCH n OPTIONAL MATCH n-[e]-() DELETE e, n RETURN DISTINCT true;"

cat test3.ndjson | node newz.js --config config.json
