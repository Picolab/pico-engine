var _ = require('lodash')
var ktypes = require('krl-stdlib/types')

var isBlank = function (str) {
  if (!_.isString(str)) {
    return true
  }
  return str.trim().length === 0
}

/**
 * Given an event json (i.e. from the web, or somewhere untrusted)
 *   + assert the required pieces are there
 *   + normalize the shape/naming conventions
 *   + make a full copy (clone) as to not mutate the original
 */
module.exports = function (eventOrig) {
  if (isBlank(eventOrig && eventOrig.eci)) {
    throw new Error('missing event.eci')
  }
  if (isBlank(eventOrig.domain)) {
    throw new Error('missing event.domain')
  }
  if (isBlank(eventOrig.type)) {
    throw new Error('missing event.type')
  }

  var attrs = {}
  if (_.has(eventOrig, 'attrs')) {
    // we want to make sure only json-able values are in the attrs
    // also want to clone it as to not mutate the original copy
    var attrsJson = ktypes.encode(eventOrig.attrs)
    // only if it's a map or array do we consider it valid
    if (attrsJson[0] === '{' || attrsJson[0] === '[') {
      attrs = ktypes.decode(attrsJson)
    }
  }

  var eid = ktypes.toString(eventOrig.eid).trim()
  if (eid.length === 0 || eid === 'null') {
    eid = 'none'
  }

  return {

    eci: eventOrig.eci.trim(),

    eid: eid,

    domain: eventOrig.domain.trim(),
    type: eventOrig.type.trim(),

    attrs: attrs

  }
}
