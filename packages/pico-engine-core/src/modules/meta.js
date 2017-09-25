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
    "picoId": function(core, ctx){
        //currently, this will be undefined durring ruleset registration
        return ctx.pico_id;
    },
    "txnId": function(core, ctx){
        return ctx.txn_id;
    },
    "rulesetName": function(core, ctx){
        return _.get(core.rsreg.get(ctx.rid), ["meta", "name"]);
    },
    "rulesetDescription": function(core, ctx){
        return _.get(core.rsreg.get(ctx.rid), ["meta", "description"]);
    },
    "rulesetAuthor": function(core, ctx){
        return _.get(core.rsreg.get(ctx.rid), ["meta", "author"]);
    },
    "ruleName": function(core, ctx){
        return ctx.rule_name;
    },
    "inEvent": function(core, ctx){
        return _.has(ctx, "event");
    },
    "inQuery": function(core, ctx){
        return _.has(ctx, "query");
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
