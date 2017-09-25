module.exports = function(core){
    return {
        get: function(ctx, id, callback){
            core.db.getEntVar(ctx.pico_id, ctx.rid, id, callback);
        },
        set: function(ctx, id, value, callback){
            core.db.putEntVar(ctx.pico_id, ctx.rid, id, value, function(err){
                callback(err);
            });
        },
        del: function(ctx, id, callback){
            core.db.removeEntVar(ctx.pico_id, ctx.rid, id, function(err){
                callback(err);
            });
        },
    };
};
