var ES = require('elasticsearch');
exports.Elastic = new ES.Client({host: 'localhost:9200'});


var Neo = require('neo4j');
exports.Neo = new Neo.GraphDatabase('http://neo4j:waag@localhost:7474');