var _ = require("lodash");

module.exports = {
    get: function(ctx, id, callback){
        if(id === "eci"){
            callback(null, _.get(ctx,["event","eci"],_.get(ctx,["query","eci"])));
            return;
        }else if(id === "rulesetURI"){
            ctx.db.getEnabledRuleset(ctx.rid, function(err, data){
                if(err) return callback(err);
                callback(null, data.url);
            });
            return;
        }
        callback(new Error("Meta attribute not defined `" + id + "`"));
    }
};
