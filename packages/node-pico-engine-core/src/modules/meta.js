var _ = require("lodash");

module.exports = {
    get: function(ctx, core, id, callback){
        if(id === "eci"){
            callback(null, _.get(ctx,["event","eci"],_.get(ctx,["query","eci"])));
            return;
        }else if(id === "rid"){
            callback(null, ctx.rid);
            return;
        }else if(id === "host"){
            callback(null, ctx.host);
            return;
        }else if(id === "rulesetURI"){
            core.db.getEnabledRuleset(ctx.rid, function(err, data){
                if(err) return callback(err);
                callback(null, data.url);
            });
            return;
        }
        callback(new Error("Meta attribute not defined `" + id + "`"));
    }
};
