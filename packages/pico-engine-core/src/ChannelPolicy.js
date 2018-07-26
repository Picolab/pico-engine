var _ = require('lodash')
var ktypes = require('krl-stdlib/types')

var isBlank = function (str) {
  return !ktypes.isString(str) || str.trim().length === 0
}

var assertOnlyAllowedProperties = function (name, obj, allowed) {
  var extraProps = _.difference(_.keys(obj), allowed)
  if (extraProps.length > 0) {
    throw new Error(name + ' does not support properties: ' + extraProps.join(', '))
  }
}

var cleanEventRules = function (rules) {
  if (ktypes.isNull(rules)) {
    return []
  }
  if (!_.isArray(rules)) {
    throw new Error('`policy.event.<allow|deny>` must be an Array of rules')
  }
  return _.map(rules, function (ruleOrig) {
    if (!ktypes.isMap(ruleOrig)) {
      throw new Error('Policy rules must be Maps, not ' + ktypes.typeOf(ruleOrig))
    }
    assertOnlyAllowedProperties('Policy.event rule', ruleOrig, ['domain', 'type'])

    var rule = {}
    if (!isBlank(ruleOrig.domain)) {
      rule.domain = ruleOrig.domain.trim()
    }
    if (!isBlank(ruleOrig.type)) {
      rule.type = ruleOrig.type.trim()
    }
    return rule
  })
}

var cleanQueryRules = function (rules) {
  if (ktypes.isNull(rules)) {
    return []
  }
  if (!_.isArray(rules)) {
    throw new Error('`policy.query.<allow|deny>` must be an Array of rules')
  }
  return _.map(rules, function (ruleOrig) {
    if (!ktypes.isMap(ruleOrig)) {
      throw new Error('Policy rules must be Maps, not ' + ktypes.typeOf(ruleOrig))
    }
    assertOnlyAllowedProperties('Policy.query rule', ruleOrig, ['rid', 'name'])

    var rule = {}
    if (!isBlank(ruleOrig.rid)) {
      rule.rid = ruleOrig.rid.trim()
    }
    if (!isBlank(ruleOrig.name)) {
      rule.name = ruleOrig.name.trim()
    }
    return rule
  })
}

var clean = function (policy) {
  if (!ktypes.isMap(policy)) {
    throw new TypeError('Policy definition should be a Map, but was ' + ktypes.typeOf(policy))
  }

  if (isBlank(policy.name)) {
    throw new Error('missing `policy.name`')
  }

  assertOnlyAllowedProperties('Policy', policy, ['name', 'event', 'query'])

  if (policy.event) {
    assertOnlyAllowedProperties('Policy.event', policy.event, ['deny', 'allow'])
  }
  if (policy.query) {
    assertOnlyAllowedProperties('Policy.query', policy.query, ['deny', 'allow'])
  }

  return {
    name: policy.name.trim(),
    event: {
      deny: cleanEventRules(policy.event && policy.event.deny),
      allow: cleanEventRules(policy.event && policy.event.allow)
    },
    query: {
      deny: cleanQueryRules(policy.query && policy.query.deny),
      allow: cleanQueryRules(policy.query && policy.query.allow)
    }
  }
}

module.exports = {
  clean: clean,
  assert: function (policy, type, data) {
    if (type !== 'event' && type !== 'query') {
      throw new Error("Channel can only assert type's \"event\" and \"query\"")
    }

    var matcher = function (rule) {
      return _.every(rule, function (val, key) {
        return val === data[key]
      })
    }

    if (_.find(policy[type].deny, matcher)) {
      throw new Error('Denied by channel policy')
    }
    if (!_.find(policy[type].allow, matcher)) {
      throw new Error('Not allowed by channel policy')
    }
    // allowed
  }
}
