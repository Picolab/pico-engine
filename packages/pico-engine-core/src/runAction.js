var _ = require('lodash')
var ktypes = require('krl-stdlib/types')
var mkKRLaction = require('./mkKRLaction')

var sendDirective = mkKRLaction([
  'name',
  'options'
], function (ctx, args) {
  if (!_.has(args, 'name')) {
    throw new Error('send_directive needs a name string')
  }
  if (!ktypes.isString(args.name)) {
    throw new TypeError('send_directive was given ' + ktypes.toString(args.name) + ' instead of a name string')
  }
  if (!_.has(args, 'options')) {
    args.options = {}
  } else if (!ktypes.isMap(args.options)) {
    throw new TypeError('send_directive was given ' + ktypes.toString(args.options) + ' instead of an options map')
  }

  return ctx.addActionResponse(ctx, 'directive', {
    name: args.name,
    options: args.options
  })
})

module.exports = async function runAction (ctx, domain, id, args, setting) {
  var returns = []
  if (domain) {
    var modAction = await ctx.modules.get(ctx, domain, id)
    if (!ktypes.isAction(modAction)) {
      throw new Error('`' + domain + ':' + id + '` is not an action')
    }
    returns = await modAction(ctx, args)
  } else if (id === 'noop') {
    returns = []// returns nothing
  } else if (ctx.scope.has(id)) {
    var definedAction = ctx.scope.get(id)
    if (!ktypes.isAction(definedAction)) {
      throw new Error('`' + id + '` is not defined as an action')
    }
    returns = await definedAction(ctx, args)
  } else if (id === 'send_directive' || id === 'sendDirective') {
    returns = await sendDirective(ctx, args)
  } else {
    throw new Error('`' + id + '` is not defined')
  }
  _.each(setting, function (id, i) {
    var val = returns[i]
    if (val === void 0 || _.isNaN(val)) {
      val = null
    }
    ctx.scope.set(id, val)
  })
}
