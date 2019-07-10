var _ = require('lodash')
var ktypes = require('krl-stdlib/types')
var mkKRLfn = require('../mkKRLfn')
var mkKRLaction = require('../mkKRLaction')

var subModules = {
  ent: require('./ent'),
  app: require('./app'),
  event: require('./event'),
  engine: require('./engine'),
  http: require('./http'),
  indy: require('./indy'),
  keys: require('./keys'),
  math: require('./math'),
  meta: require('./meta'),
  schedule: require('./schedule'),
  time: require('./time'),
  random: require('./random')
}

var normalizeId = function (domain, id) {
  if (domain !== 'ent' && domain !== 'app') {
    return ktypes.toString(id)
  }
  if (_.has(id, 'key') && ktypes.isString(id.key)) {
    return {
      var_name: id.key,
      query: ktypes.isArray(id.path)
        ? id.path
        : [id.path]
    }
  }
  return {
    var_name: ktypes.toString(id),
    query: []
  }
}

module.exports = function (core, thirdPartyModules) {
  var modules = _.mapValues(subModules, function (subModule) {
    return subModule(core)
  })

  _.each(thirdPartyModules, function (ops, domain) {
    if (_.has(modules, domain)) {
      throw new Error('You cannot override the built-in `' + domain + ':*` module')
    }
    modules[domain] = {
      def: {}
    }
    _.each(ops, function (op, id) {
      var mkErr = function (msg) {
        return new Error('Custom module ' + domain + ':' + id + ' ' + msg)
      }
      if (!op ||
                !_.isArray(op.args) ||
                !_.every(op.args, _.isString) ||
                _.size(op.args) !== _.size(_.uniq(op.args))
      ) {
        throw mkErr('`args` must be a unique array of strings')
      }
      if (!_.isFunction(op.fn)) {
        throw mkErr('`fn` must be `function(args){...}`')
      }

      var fn = function (ctx, args) {
        return op.fn(args)
      }

      if (op.type === 'function') {
        modules[domain].def[id] = mkKRLfn(op.args, fn)
      } else if (op.type === 'action') {
        modules[domain].def[id] = mkKRLaction(op.args, fn)
      } else {
        throw mkErr('`type` must be "action" or "function"')
      }
    })
  })

  var userModuleLookup = function (ctx, domain, id) {
    var umod = _.get(core.rsreg.get(ctx.rid), ['modules_used', domain])
    var hasIt = _.has(umod, 'scope') &&
            umod.scope.has(id) &&
            _.includes(umod.provides, id)

    var value = hasIt ? umod.scope.get(id) : void 0
    return {
      hasIt: hasIt,
      value: value
    }
  }

  return {
    get: function (ctx, domain, id) {
      id = normalizeId(domain, id)
      var umod = userModuleLookup(ctx, domain, id)
      if (umod.hasIt) {
        return umod.value
      }
      if (_.has(modules, [domain, 'def', id])) {
        return modules[domain].def[id]
      }
      if (_.has(modules, [domain, 'get'])) {
        return modules[domain].get(ctx, id)
      }
      throw new Error('Not defined `' + domain + ':' + id + '`')
    },

    set: function (ctx, domain, id, value) {
      id = normalizeId(domain, id)
      if (!_.has(modules, domain)) {
        throw new Error('Module not defined `' + domain + ':' + id + '`')
      }
      if (!_.has(modules[domain], 'set')) {
        throw new Error('Cannot assign to `' + domain + ':*`')
      }
      return modules[domain].set(ctx, id, value)
    },

    append: function (ctx, domain, id, values) {
      id = normalizeId(domain, id)
      if (!_.has(modules, domain)) {
        throw new Error('Module not defined `' + domain + ':' + id + '`')
      }
      if (!_.has(modules[domain], 'append')) {
        throw new Error('Cannot append to `' + domain + ':*`')
      }
      return modules[domain].append(ctx, id, values)
    },

    del: function (ctx, domain, id) {
      id = normalizeId(domain, id)
      if (!_.has(modules, domain)) {
        throw new Error('Module not defined `' + domain + ':' + id + '`')
      }
      if (!_.has(modules[domain], 'del')) {
        throw new Error('Cannot clear/delete to `' + domain + ':*`')
      }
      return modules[domain].del(ctx, id)
    }
  }
}
