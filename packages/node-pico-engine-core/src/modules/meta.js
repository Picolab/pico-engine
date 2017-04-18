var _ = require("lodash");

var getCoreCTXval = {
    "eci": function(core, ctx){
        return _.get(ctx, ["event", "eci"], _.get(ctx, ["query", "eci"]));
    },
    "rid": function(core, ctx){
        return ctx.rid;
    },
    "host": function(core, ctx){
        return core.host;
    },
    "rulesetName": function(core, ctx){
        return _.get(core.rulesets, [ctx.rid, "meta", "name"]);
    },
    "rulesetDescription": function(core, ctx){
        return _.get(core.rulesets, [ctx.rid, "meta", "description"]);
    },
    "rulesetAuthor": function(core, ctx){
        return _.get(core.rulesets, [ctx.rid, "meta", "author"]);
    },
    "ruleName": function(core, ctx){
        return ctx.rule_name;
    },
};

module.exports = function(core){
    return {
        get: function(ctx, id, callback){
            if(_.has(getCoreCTXval, id)){
                callback(null, getCoreCTXval[id](core, ctx));
                return;
            }
            if(id === "rulesetURI"){
                core.db.getEnabledRuleset(ctx.rid, function(err, data){
                    if(err) return callback(err);
                    callback(null, data.url);
                });
                return;
            }
            callback(new Error("Meta attribute not defined `" + id + "`"));
        }
    };
};
