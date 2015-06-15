Creates edge

	http POST :5000/foo/LIES_IN/ source:=1 target:=2 doc:='{"a":123}'

	http POST :5000/foo/PIT/999 doc:='{"hey":"there"}'

	http GET :5000/query/get-node-by-id id="foo/999"

Response:

	HTTP/1.1 200 OK
	Connection: keep-alive
	Content-Type: application/json
	Date: Wed, 10 Jun 2015 14:35:38 GMT
	Transfer-Encoding: chunked

	{
	    "data": [
		{
		    "n": {
			"_id": 31,
			"labels": [
			    "_"
			],
			"properties": {
			    "id": "foo/999"
			}
		    }
		}
	    ],
	    "ok": true
	}

Notice the `_id`. We can now retrieve directly from Neo, without going through
an index.

	http GET :5000/query/get-node-by-neo-id id="31"

Response:

	http GET :5000/query/get-node-by-neo-id id:=31
	HTTP/1.1 200 OK
	Connection: keep-alive
	Content-Type: application/json
	Date: Wed, 10 Jun 2015 14:40:06 GMT
	Transfer-Encoding: chunked

	{
	    "data": [
		{
		    "n": {
			"_id": 31,
			"labels": [
			    "_"
			],
			"properties": {
			    "id": "foo/999"
			}
		    }
		}
	    ],
	    "ok": true
	}

Find adjecent edges

	http GET :5000/query/get-adjecent id="foo/999"


