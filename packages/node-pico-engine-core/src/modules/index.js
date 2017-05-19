var _ = require("lodash");
var cocb = require("co-callback");

var sub_modules = {
    ent: require("./ent"),
    app: require("./app"),
    event: require("./event"),
    engine: require("./engine"),
    http: require("./http"),
    keys: require("./keys"),
    meta: require("./meta"),
    schedule: require("./schedule"),
    time: require("./time")
};

module.exports = function(core){
    var modules = _.mapValues(sub_modules, function(m){
        return m(core);
    });
    return {
        get: cocb.toYieldable(function(ctx, domain, id, callback){
            if(_.has(modules, [domain, "def", id])){
                callback(null, modules[domain].def[id]);
                return;
            }
            if(_.has(modules, [domain, "get"])){
                modules[domain].get(ctx, id, callback);
                return;
            }
            var umod = _.get(core.rsreg.get(ctx.rid), ["modules_used", domain]);
            if(_.has(umod, "scope")
                && umod.scope.has(id)
                && _.includes(umod.provides, id)
            ){
                callback(null, umod.scope.get(id));
                return;
            }
            callback(new Error("Not defined `" + domain + ":" + id + "`"));
        }),
        set: cocb.toYieldable(function(ctx, domain, id, value, callback){
            if(_.has(modules, domain)){
                if(_.has(modules[domain], "set")){
                    modules[domain].set(ctx, id, value, callback);
                    return;
                }
                callback(new Error("Cannot assign to `" + domain + ":*`"));
                return;
            }
            callback(new Error("Not defined `" + domain + ":" + id + "`"));
        }),
        del: cocb.toYieldable(function(ctx, domain, id, callback){
            if(!_.has(modules, domain)){
                callback(new Error("Module not defined `" + domain + ":" + id + "`"));
                return;
            }
            if(!_.has(modules[domain], "del")){
                callback(new Error("Cannot clear/delete to `" + domain + ":*`"));
                return;
            }
            modules[domain].del(ctx, id, callback);
        }),
        action: cocb.wrap(function*(ctx, domain, id, args){
            if(!_.has(modules, [domain, "actions", id])){
                throw new Error("Not an action `" + domain + ":" + id + "`");
            }
            return yield modules[domain].actions[id](ctx, args);
        }),
    };
};
