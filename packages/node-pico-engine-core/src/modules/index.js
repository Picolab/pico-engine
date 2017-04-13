var _ = require("lodash");
var cocb = require("co-callback");

var modules = {
    ent: require("./ent"),
    app: require("./app"),
    event: require("./event"),
    engine: require("./engine"),
    http: require("./http"),
    keys: require("./keys"),
    meta: require("./meta"),
    time: require("./time")
};

module.exports = function(core){
    return {
        get: cocb.toYieldable(function(ctx, domain, id, callback){
            if(_.has(modules, [domain, "def", id])){
                callback(null, modules[domain].def[id]);
                return;
            }
            if(_.has(modules, [domain, "get"])){
                modules[domain].get(ctx, core, id, callback);
                return;
            }
            if(_.has(ctx, ["modules_used", domain, "scope"])){
                if(ctx.modules_used[domain].scope.has(id)){
                    if(_.includes(ctx.modules_used[domain].provides, id)){
                        callback(null, ctx.modules_used[domain].scope.get(id));
                        return;
                    }
                }
            }
            callback(new Error("Not defined `" + domain + ":" + id + "`"));
        }),
        set: cocb.toYieldable(function(ctx, domain, id, value, callback){
            if(_.has(modules, domain)){
                if(_.has(modules[domain], "set")){
                    modules[domain].set(ctx, core, id, value, callback);
                    return;
                }
                callback(new Error("Cannot assign to `" + domain + ":*`"));
                return;
            }
            callback(new Error("Not defined `" + domain + ":" + id + "`"));
        })
    };
};
