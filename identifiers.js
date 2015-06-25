var normalizer = require('histograph-uri-normalizer');

/*

	URI's that we know about are minimized into URNs
	http://vocab.getty.com/thing/1234?v=1 ~> 'urn:hg:tgn:v=1,thing=1234'

	URI's that we dont know are left as-is.

	Identifiers in the HG-id tradition `foo/123` are mapped to internal-only URNs
	foo/123 ~> urn:hgid:foo/123

	Identifiers without HG scope `123` are mapped to scoped integer-only URNs
	123 ~> urn:hgid:foo/123

*/

// match if this string looks like a URI
var SCHEME = /^[a-zA-Z][a-zA-Z0-9+-\.]*:$/

// match `a/b` HG identifiers
var HGID = /^[a-zA-Z0-9\.+-_]+\/[a-zA-Z0-9\.+-_]+$/

// match normal identifiers
var ID = /^[a-zA-Z0-9\.+-_]+$/

module.exports = function normalize(s, dataset)
{
	// normalize URIs
	if (SCHEME.test(s))
	{
		try {
			return normalizer.URLtoURN(s, dataset);
		}
		catch(e) {
			return s;
		}
	}

	if(HGID.test(s))
		return 'urn:hgid:' + s;

	if(ID.test(s))
		return 'urn:hgid:' + dataset + '/' + s;
	
	throw new Error('Invalid identifier "' + s + '", must be URI or /^[a-zA-Z0-9\.+-_]+$/' );
}