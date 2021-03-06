if ( ! window['moment']) require('moment');

var type = require('type')
  , cast = require('sg-cast')
  , each = require('each')
  , clone = require('clone')
  , isEmpty = require('sg-is-empty')

function getDefault(_key) {

	var defaults = {

		'Array'   : [],
		'Boolean' : false,
		'Date'    : new Date(),
		'Moment'  : moment(),
		'Number'  : 0,
		'Object'  : {},
		'String'  : '',
		'*'       : '',

	}

	return defaults.hasOwnProperty(_key) ? defaults[_key] : ''

}

function getSchemaProperties(_properties) {

	var properties

	properties               = type(_properties) == 'object' ? _properties : /function|string/i.test(type(_properties)) ? { _type : _properties } : {};
	properties._type         = properties.hasOwnProperty('_type') ? properties._type : Object;
	properties._optional     = cast(properties['_optional'], Boolean, false);
	properties._default      = properties['_default'];
	properties._values       = cast(properties['_values'], Array, []);
	properties._typeAsString = type(properties._type) == 'string' ? properties._type : cast(properties._type, String, '').match(/^function ([^\(]*)\(\)/)[1];
	properties._typeDefault  = getDefault(properties._typeAsString);

	return properties;

}

function parseResult(_schema, _data, _disableAutoDefaults) {

	var properties
	  , objectData
	  , defaultData

	each(Object.keys(_schema), function(_key) {

		properties  = getSchemaProperties(_schema[_key]);
		objectData  = {};
		defaultData = type(properties._default) != 'undefined' || _disableAutoDefaults ? properties._default : properties._typeDefault;

		// Find non system keys (probably an object)
		each(Object.keys(properties), function(_propertyKey){

			if (/^[^_]/.test(_propertyKey)) {

				objectData[_propertyKey] = properties[_propertyKey];

			}

		});

		// If it's mandatory or it's optional and there's data
		if (properties._optional == false || (properties._optional == true && type(_data[_key]) != 'undefined')) {

			_schema[_key] = (isEmpty(objectData) && (type(_data[_key]) != 'object' || properties._type == Object)) || properties._type == '*'
			              ? cast(_data[_key], properties._type, defaultData, properties._values, properties)
			              : parseResult(objectData, cast(_data[_key], Object, {}), _disableAutoDefaults)

		}  else {

			delete _schema[_key];

		}

	});

	return _schema;

}

function apply(_schema, _data, _disableAutoDefaults) {

	var schema = type(_schema) == 'object' ? clone(_schema) : {}
	  , data   = type(_data)   == 'object' ? clone(_data)   : {}

	return isEmpty(schema) ? _data : parseResult(schema, data, _disableAutoDefaults);

}

exports.apply = apply;