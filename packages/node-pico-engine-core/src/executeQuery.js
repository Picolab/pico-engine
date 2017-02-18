var _ = require("lodash");
var cocb = require("co-callback");
var runKRL = require("./runKRL");

module.exports = function(ctx, callback){
    cocb.run(function*(){
        var pico = yield ctx.db.getPicoYieldable(ctx.pico_id);
        if(!pico){
            throw new Error("Invalid eci: " + ctx.query.eci);
        }
        if(!_.has(pico.ruleset, ctx.query.rid)){
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
            return yield runKRL(val, ctx, ctx.query.args);
        }
        return val;
    }, callback);
};
