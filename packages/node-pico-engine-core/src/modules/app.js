module.exports = function(core){
    return {
        get: function(ctx, id, callback){
            core.db.getAppVar(ctx.rid, id, callback);
        },
        set: function(ctx, id, value, callback){
            core.db.putAppVar(ctx.rid, id, value, function(err){
                callback(err);
            });
        },
        del: function(ctx, id, callback){
            core.db.removeAppVar(ctx.rid, id, function(err){
                callback(err);
            });
        },
    };
};
