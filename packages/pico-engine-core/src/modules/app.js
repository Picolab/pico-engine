module.exports = function (core) {
  return {
    get: function (ctx, id) {
      return core.db.getAppVar(ctx.rid, id.var_name, id.query)
    },
    set: function (ctx, id, value) {
      return core.db.putAppVar(ctx.rid, id.var_name, id.query, value)
    },
    del: function (ctx, id) {
      return core.db.delAppVar(ctx.rid, id.var_name, id.query)
    }
  }
}
