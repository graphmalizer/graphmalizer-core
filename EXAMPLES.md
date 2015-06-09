Creates edge

	http POST :5000/foo/LIES_IN/ source:=1 target:=2 doc:='{"a":123}'

	HTTP/1.1 200 OK
	Connection: keep-alive
	Content-Type: application/json
	Date: Tue, 09 Jun 2015 23:49:02 GMT
	Transfer-Encoding: chunked

	{
	    "data": [

this is the ES response

		{
		    "_id": "34Pqb+CeRCVVA+81OnK6E56i/D6H+29264LD1w==",
		    "_index": "foo",
		    "_type": "LIES_IN",
		    "_version": 26,
		    "created": false
		},

this is the Neo4J response

		[
		    {
			"e": {
			    "_fromId": 0,
			    "_id": 1,
			    "_toId": 1,
			    "properties": {},
			    "type": "SAMEHGCONCEPT"
			}
		    },
		    {
			"e": {
			    "_fromId": 1,
			    "_id": 0,
			    "_toId": 0,
			    "properties": {},
			    "type": "SAMEHGCONCEPT"
			}
		    },
		    {
			"e": {
			    "_fromId": 4,
			    "_id": 2,
			    "_toId": 5,
			    "properties": {},
			    "type": "LIKES"
			}
		    },
	maor hacking
		    {
			"e": {
			    "_fromId": 8,
			    "_id": 3,
			    "_toId": 9,
			    "properties": {},
			    "type": "FOO"
			}
		    },
		    {
			"e": {
			    "_fromId": 14,
			    "_id": 7,
			    "_toId": 15,
			    "properties": {},
			    "type": "_"
			}
		    },
		    {
			"e": {
			    "_fromId": 16,
			    "_id": 8,
			    "_toId": 17,
			    "properties": {},
			    "type": "_I_"
			}
		    }
		]
	    ],
	    "ok": true
	}
