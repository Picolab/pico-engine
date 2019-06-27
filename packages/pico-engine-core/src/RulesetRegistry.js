var _ = require('lodash')

var SalienceGraph = function () {
  var graph = {}
  var put = function (rs) {
    del(rs.rid)// clear out the old one, if pressent
    _.each(rs.rules, function (rule) {
      rule.rid = rs.rid
      _.each(rule.select && rule.select.graph, function (g, domain) {
        _.each(g, function (exprs, type) {
          _.set(graph, [domain, type, rule.rid, rule.name], true)
        })
      })
    })
  }
  var get = function (domain, type) {
    return _.get(graph, [domain, type], {})
  }
  var del = function (rid) {
    _.each(graph, function (dataD, domain) {
      _.each(dataD, function (dataT, type) {
        // clear out any old versions graph
        _.unset(graph, [domain, type, rid])
      })
    })
  }
  return Object.freeze({
    put: put,
    get: get,
    del: del
  })
}

module.exports = function () {
  var rulesets = {}
  var salienceGraph = SalienceGraph()
  var keysModuleData = {}

  return Object.freeze({
    get: function (rid) {
      return rulesets[rid]
    },
    put: function (rs) {
      if (true &&
                _.has(rs, 'meta.keys') &&
                _.has(rs, 'meta.provides_keys')
      ) {
        _.each(rs.meta.provides_keys, function (p, key) {
          _.each(p.to, function (toRid) {
            _.set(keysModuleData, [
              'provided',
              rs.rid,
              toRid,
              key
            ], _.cloneDeep(rs.meta.keys[key]))
          })
        })
      }

      if (_.has(rs, 'meta.keys')) {
        // "remove" keys so they don't leak out
        // don't use delete b/c it mutates the loaded rs
        rs = _.assign({}, rs, {
          meta: _.omit(rs.meta, 'keys')
        })
      }

      salienceGraph.put(rs)
      rulesets[rs.rid] = rs
    },
    del: function (rid) {
      salienceGraph.del(rid)
      delete rulesets[rid]
    },
    setupOwnKeys: function (rs) {
      if (rs.meta && rs.meta.keys) {
        _.each(rs.meta.keys, function (value, key) {
          _.set(keysModuleData, ['used_keys', rs.rid, key], value)
        })
      }
    },
    provideKey: function (rid, useRid) {
      if (_.has(keysModuleData, ['provided', useRid, rid])) {
        _.each(keysModuleData.provided[useRid][rid], function (value, key) {
          _.set(keysModuleData, ['used_keys', rid, key], value)
        })
      }
    },
    getKey: function (rid, keyId) {
      return _.get(keysModuleData, ['used_keys', rid, keyId])
    },
    salientRules: function (domain, type, ridFilter) {
      var toRun = salienceGraph.get(domain, type)
      var rulesToSelect = []
      _.each(toRun, function (rules, rid) {
        if (!ridFilter(rid)) {
          return
        }
        _.each(rules, function (isOn, ruleName) {
          if (!isOn) {
            return
          }
          var rule = _.get(rulesets, [rid, 'rules', ruleName])
          if (!rule) {
            return
          }
          // shallow clone with it's own scope for this run
          rulesToSelect.push(_.assign({}, rule, {
            scope: rulesets[rid].scope.push()
          }))
        })
      })
      return rulesToSelect
    },
    assertNoDependants: function (rid) {
      _.each(rulesets, function (rs) {
        _.each(rs.modules_used, function (info) {
          if (info.rid === rid) {
            throw new Error('"' + rid + '" is depended on by "' + rs.rid + '"')
          }
        })
      })
    },
    getImmediateDependants: function (rid) {
      const dependants = []
      _.each(rulesets, function (rs) {
        _.each(rs.modules_used, function (info) {
          if (info.rid === rid) {
            dependants.push(rs.rid)
          }
        })
      })
      return dependants
    }
  })
}
