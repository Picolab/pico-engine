var _ = require('lodash')

var types = {}

types.isNull = function (val) {
  return val === null || val === void 0 || _.isNaN(val)
}

types.isBoolean = function (val) {
  return val === true || val === false
}

types.isString = function (val) {
  return _.isString(val)
}

types.isNumber = function (val) {
  return _.isFinite(val)
}

types.isRegExp = function (val) {
  return _.isRegExp(val)
}

types.isArray = function (val) {
  return _.isArray(val)
}

types.isMap = function (val) {
  // Can't use _.isPlainObject b/c it's to restrictive on what is a "plain" object
  // especially when accepting values from other libraries outside of KRL
  return types.isArrayOrMap(val) &&
        !_.isArray(val)
}

types.isArrayOrMap = function (val) {
  return _.isObject(val) &&
        !_.isFunction(val) &&
        !_.isRegExp(val) &&
        !_.isString(val) &&
        !_.isNumber(val)
}

types.isFunction = function (val) {
  return _.isFunction(val) && !val.is_an_action
}

types.isAction = function (val) {
  return _.isFunction(val) && val.is_an_action === true
}

types.typeOf = function (val) {
  var krlTypes = [
    'Null',
    'Boolean',
    'String',
    'Number',
    'RegExp',
    'Array',
    'Function',
    'Action',
    'Map'
  ]
  var i
  var type
  for (i = 0; i < krlTypes.length; i++) {
    type = krlTypes[i]
    if (types['is' + type](val)) {
      return type
    }
  }
  return 'JSObject'
}

var deepClean = function (val, mapFn) {
  return mapFn(val, function (v) {
    return types.cleanNulls(v)
  })
}

// returns a clone of val with void 0 and NaN values converted to null
types.cleanNulls = function (val) {
  if (types.isNull(val)) {
    return null
  }
  if (types.isArray(val)) {
    return deepClean(val, _.map)
  }
  if (types.isMap(val)) {
    return deepClean(val, _.mapValues)
  }
  return val
}

types.toNumberOrNull = function (val) {
  switch (types.typeOf(val)) {
    case 'Null':
      return 0
    case 'Boolean':
      return val ? 1 : 0
    case 'String':
      var n = _.toNumber(val)
      return _.isNaN(n) ? null : n
    case 'Number':
      return val
    case 'Array':
    case 'Map':
      return _.size(val)
    case 'RegExp':
    case 'Function':
    case 'Action':
  }
  return null
}

types.toString = function (val) {
  var valType = types.typeOf(val)
  if (valType === 'String') {
    return val
  } else if (valType === 'Null') {
    return 'null'
  } else if (valType === 'Boolean') {
    return val ? 'true' : 'false'
  } else if (valType === 'Number') {
    return val + ''
  } else if (valType === 'RegExp') {
    // NOTE: val.flags doesn't work on old versions of JS
    var flags = ''
    if (val.global) {
      flags += 'g'
    }
    if (val.ignoreCase) {
      flags += 'i'
    }
    return 're#' + val.source + '#' + flags
  }
  return '[' + valType + ']'
}

types.encode = function (val, indent) {
  indent = _.parseInt(indent, 10) || 0// default to 0 (no indent)
  return JSON.stringify(val, function (k, v) {
    switch (types.typeOf(v)) {
      case 'Null':
        return null
      case 'JSObject':
      case 'RegExp':
      case 'Function':
      case 'Action':
        return types.toString(v)
    }
    return v
  }, indent)
}

types.decode = function (val) {
  if (!types.isString(val)) {
    return val
  }
  try {
    return JSON.parse(val)
  } catch (e) {
    return val
  }
}

types.isEqual = function (left, right) {
  left = types.cleanNulls(left)
  right = types.cleanNulls(right)
  return _.isEqual(left, right)
}

module.exports = types
