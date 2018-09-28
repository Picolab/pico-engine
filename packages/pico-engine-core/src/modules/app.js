module.exports = function (core) {
  return {
    get: function (ctx, id) {
      return core.db.getAppVarYieldable(ctx.rid, id.var_name, id.query)
    },
    set: function (ctx, id, value) {
      return core.db.putAppVarYieldable(ctx.rid, id.var_name, id.query, value)
    },
    del: function (ctx, id) {
      return core.db.delAppVarYieldable(ctx.rid, id.var_name, id.query)
    }
  }
}
