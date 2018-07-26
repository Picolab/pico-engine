var _ = require('lodash')
var ktypes = require('krl-stdlib/types')

var isBlank = function (str) {
  if (!_.isString(str)) {
    return true
  }
  return str.trim().length === 0
}

/**
 * Given a query json (i.e. from the web, or somewhere untrusted)
 *   + assert the required pieces are there
 *   + normalize the shape/naming conventions
 *   + make a full copy (clone) as to not mutate the original
 */
module.exports = function (queryOrig) {
  if (isBlank(queryOrig && queryOrig.eci)) {
    throw new Error('missing query.eci')
  }
  if (isBlank(queryOrig.rid)) {
    throw new Error('missing query.rid')
  }
  if (isBlank(queryOrig.name)) {
    throw new Error('missing query.name')
  }

  var args = {}
  if (_.has(queryOrig, 'args')) {
    // we want to make sure only json-able values are in the args
    // also want to clone it as to not mutate the original copy
    var attrsJson = ktypes.encode(queryOrig.args)
    // only if it's a map or array do we consider it valid
    if (attrsJson[0] === '{' || attrsJson[0] === '[') {
      args = ktypes.decode(attrsJson)
    }
  }

  return {
    eci: queryOrig.eci.trim(),

    rid: queryOrig.rid.trim(),

    name: queryOrig.name.trim(),

    args: args
  }
}
