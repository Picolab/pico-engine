var _ = require('lodash')
var runKRL = require('./runKRL')
var ktypes = require('krl-stdlib/types')

module.exports = async function processQuery (core, ctx) {
  await core.db.assertPicoID(ctx.pico_id)

  var picoRids = await core.db.ridsOnPico(ctx.pico_id)
  if (picoRids[ctx.query.rid] !== true) {
    throw new Error('Pico does not have that rid: ' + ctx.query.rid)
  }

  var err
  var rs = core.rsreg.get(ctx.query.rid)
  if (!rs) {
    err = new Error('RID not found: ' + ctx.query.rid)
    err.notFound = true
    throw err
  }
  var shares = _.get(rs, ['meta', 'shares'])
  if (!_.isArray(shares) || !_.includes(shares, ctx.query.name)) {
    throw new Error('Not shared: ' + ctx.query.name)
  }
  if (!rs.scope.has(ctx.query.name)) {
    err = new Error('Shared, but not defined: ' + ctx.query.name)
    err.notFound = true
    throw err
  }

  /// /////////////////////////////////////////////////////////////////////
  ctx = core.mkCTX({
    query: ctx.query,
    pico_id: ctx.pico_id,
    rid: rs.rid,
    scope: rs.scope
  })
  var val = ctx.scope.get(ctx.query.name)
  if (_.isFunction(val)) {
    val = await runKRL(function (ctx, args) {
      // use ctx.applyFn so it behaves like any other fn call
      // i.e. errors on trying defaction like a function
      return ctx.applyFn(val, ctx, args)
    }, ctx, ctx.query.args)
  }
  // To ensure we don't leak out functions etc.
  return ktypes.decode(ktypes.encode(val))
}
