module.exports = function(core){
    return {
        get: function(ctx, id, path, callback){
            core.db.getEntVar(ctx.pico_id, ctx.rid, id, callback);
        },
        set: function(ctx, id, path, value, callback){
            core.db.putEntVar(ctx.pico_id, ctx.rid, id, value, function(err){
                callback(err);
            });
        },
        del: function(ctx, id, path, callback){
            core.db.removeEntVar(ctx.pico_id, ctx.rid, id, function(err){
                callback(err);
            });
        },
    };
};
