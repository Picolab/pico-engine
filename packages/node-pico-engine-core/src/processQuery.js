var _ = require("lodash");
var cocb = require("co-callback");
var runKRL = require("./runKRL");

module.exports = function(core, ctx, callback){
    cocb.run(function*(){
        var pico = yield core.db.getPicoYieldable(ctx.pico_id);
        var err;
        if(!pico){
            throw new Error("Invalid eci: " + ctx.query.eci);
        }
        if(!_.has(pico.ruleset, ctx.query.rid)){
            throw new Error("Pico does not have that rid: " + ctx.query.rid);
        }
        var rs = core.rsreg.get(ctx.query.rid);
        if(!rs){
            err = new Error("RID not found: " + ctx.query.rid);
            err.notFound = true;
            throw err;
        }
        var shares = _.get(rs, ["meta", "shares"]);
        if(!_.isArray(shares) || !_.includes(shares, ctx.query.name)){
            throw new Error("Not shared: " + ctx.query.name);
        }
        if(!rs.scope.has(ctx.query.name)){
            err = new Error("Shared, but not defined: " + ctx.query.name);
            err.notFound = true;
            throw err;
        }

        ////////////////////////////////////////////////////////////////////////
        ctx = core.mkCTX({
            query: ctx.query,
            pico_id: ctx.pico_id,
            rid: rs.rid,
            scope: rs.scope,
        });
        var val = ctx.scope.get(ctx.query.name);
        if(_.isFunction(val)){
            return yield runKRL(function*(ctx, args){
                //use ctx.applyFn so it behaves like any other fn call
                //i.e. errors on trying defaction like a function
                return yield ctx.applyFn(val, ctx, args);
            }, ctx, ctx.query.args);
        }
        return val;
    }, callback);
};
