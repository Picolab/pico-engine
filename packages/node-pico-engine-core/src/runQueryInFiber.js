var _ = require("lodash");

module.exports = function(ctx, pico_id){
  ctx.pico = ctx.db.getPicoFuture(pico_id).wait();
  if(!ctx.pico){
    throw new Error("Invalid eci: " + ctx.query.eci);
  }
  if(!_.has(ctx.pico.ruleset, ctx.query.rid)){
    throw new Error("Pico does not have that rid");
  }
  if(!_.has(ctx.rulesets, ctx.query.rid)){
    throw new Error("Not found: rid");
  }
  var rs = ctx.rulesets[ctx.query.rid];
  var shares = _.get(rs, ["meta", "shares"]);
  if(!_.isArray(shares) || !_.includes(shares, ctx.query.name)){
    throw new Error("Not shared");
  }
  if(!rs.scope.has(ctx.query.name)){
    throw new Error("Shared, but not defined: " + ctx.query.name);
  }

  ////////////////////////////////////////////////////////////////////////
  ctx.rid = rs.rid;
  ctx.modules_used = rs.modules_used;
  ctx.scope = rs.scope;
  var val = ctx.scope.get(ctx.query.name);
  if(_.isFunction(val)){
    return val(ctx, ctx.query.args);
  }
  return val;
};
