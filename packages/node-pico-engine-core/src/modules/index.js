var _ = require("lodash");
var cocb = require("co-callback");
var ktypes = require("krl-stdlib/types");
var mkKRLfn = require("../mkKRLfn");

var sub_modules = {
    ent: require("./ent"),
    app: require("./app"),
    event: require("./event"),
    engine: require("./engine"),
    http: require("./http"),
    keys: require("./keys"),
    meta: require("./meta"),
    schedule: require("./schedule"),
    time: require("./time"),
    random: require("./random"),
};

module.exports = function(core, third_party_modules){

    var modules = _.mapValues(sub_modules, function(m){
        return m(core);
    });

    _.each(third_party_modules, function(ops, domain){
        if(_.has(modules, domain)){
            throw new Error("You cannot override the built-in `" + domain + ":*` module");
        }
        modules[domain] = {
            def: {},
            actions: {},
        };
        _.each(ops, function(op, id){
            var mkErr = function(msg){
                return new Error("Custom module " + domain + ":" + id + " " + msg);
            };
            if(!op
                || !_.isArray(op.args)
                || !_.every(op.args, _.isString)
                || _.size(op.args) !== _.size(_.uniq(op.args))
            ){
                throw mkErr("`args` must be a unique array of strings");
            }
            if(!_.isFunction(op.fn)){
                throw mkErr("`fn` must be `function(args, callback){...}`");
            }

            var fn = op.fn;
            var krlFN = mkKRLfn(op.args, function(args, ctx, callback){
                fn(args, callback);
            });

            if(op.type === "function"){
                modules[domain].def[id] = krlFN;
            }else if(op.type === "action"){
                modules[domain].actions[id] = krlFN;
            }else{
                throw mkErr("`type` must be \"action\" or \"function\"");
            }
        });
    });


    var userModuleLookup = function(ctx, domain, id){
        var umod = _.get(core.rsreg.get(ctx.rid), ["modules_used", domain]);
        var has_it = _.has(umod, "scope")
            && umod.scope.has(id)
            && _.includes(umod.provides, id)
            ;
        var value = has_it ? umod.scope.get(id) : void 0;
        return {
            has_it: has_it,
            value: value,
        };
    };


    return {
        get: cocb.toYieldable(function(ctx, domain, id, callback){
            var umod = userModuleLookup(ctx, domain, id);
            if(umod.has_it){
                callback(null, umod.value);
                return;
            }
            if(_.has(modules, [domain, "def", id])){
                callback(null, modules[domain].def[id]);
                return;
            }
            if(_.has(modules, [domain, "get"])){
                modules[domain].get(ctx, id, callback);
                return;
            }
            callback(new Error("Not defined `" + domain + ":" + id + "`"));
        }),


        set: cocb.toYieldable(function(ctx, domain, id, value, callback){
            if(!_.has(modules, domain)){
                callback(new Error("Module not defined `" + domain + ":" + id + "`"));
                return;
            }
            if(!_.has(modules[domain], "set")){
                callback(new Error("Cannot assign to `" + domain + ":*`"));
                return;
            }
            modules[domain].set(ctx, id, value, callback);
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

            var umod = userModuleLookup(ctx, domain, id);
            if(umod.has_it && ktypes.isAction(umod.value)){
                return yield umod.value(ctx, args);
            }

            if(_.has(modules, [domain, "actions", id])){
                return [//actions have multiple returns
                    //built in modules return only one value
                    yield modules[domain].actions[id](ctx, args),
                ];
            }

            throw new Error("Not an action `" + domain + ":" + id + "`");
        }),
    };
};
