var hashOf = require('../utils/hashOf');

var requireSourceTarget = function(input)
{
	// must have source and target
	if(!(input.source && input.target))
		throw new Error(u.format("Type '%s' has %s structure and thus requires `source` and `target` fields.", input.type, input.structure));

	// if we have no id, generate one using hash of s,type,t
	return input.id || hashOf([input.source,input.type,input.target]);
};

var requireId = function(input)
{
	if(!input.id)
		throw new Error(u.format("Type '%s' has %s structure and requires the `id` field", input.type, input.structure));

	return input.id;
};

// we define how identifiers are created for each structure here
var ensureIdentifier = {
	node: requireId,
	arc: requireSourcTarget,
	equivalence: requireSourceTarget
};

module.exports = function(config) {

	// for faster error reporting
	var names = Object.keys(config.types).join(' ');

	// and type to structure name lookup
	var types = R.mapObj(R.compose(R.head, Object.keys), config.types)

	function prepareInput(input) {
		// everything starts with a type
		if(!input.type)
			throw new Error(u.format("Input has to have a type field"));

		// it has to be defined in the config
		if(!config.types[input.type])
			throw new Error(u.format('Unknown type "%s", must be one of: %s', input.type, names));

		// set structure name
		o.structure = structureNames[input.type]
		
		// compute id if missing
		input.id = ensureIdentifier[structure](request);

		return input;
	}
}