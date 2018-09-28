module.exports = function (core) {
  return {
    get: function (ctx, id) {
      return core.db.getEntVarYieldable(ctx.pico_id, ctx.rid, id.var_name, id.query)
    },
    set: function (ctx, id, value) {
      return core.db.putEntVarYieldable(ctx.pico_id, ctx.rid, id.var_name, id.query, value)
    },
    del: function (ctx, id) {
      return core.db.delEntVarYieldable(ctx.pico_id, ctx.rid, id.var_name, id.query)
    }
  }
}
