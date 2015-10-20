#!/bin/bash

echo '{"type":"node", "id":"a", "dataset": "test"}' | node stdin.js

echo '-{"type":"equivalence", "source":"a", "target": "a", "dataset": "test"}' | node stdin.js

