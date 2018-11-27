module.exports = function (core) {
  return {
    get: function (ctx, id) {
      return core.db.getEntVar(ctx.pico_id, ctx.rid, id.var_name, id.query)
    },
    set: function (ctx, id, value) {
      return core.db.putEntVar(ctx.pico_id, ctx.rid, id.var_name, id.query, value)
    },
    del: function (ctx, id) {
      return core.db.delEntVar(ctx.pico_id, ctx.rid, id.var_name, id.query)
    }
  }
}
