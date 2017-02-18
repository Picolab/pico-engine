module.exports = {
    get: function(ctx, id, callback){
        ctx.db.getEntVar(ctx.pico_id, ctx.rid, id, callback);
    },
    set: function(ctx, id, value, callback){
        ctx.db.putEntVar(ctx.pico_id, ctx.rid, id, value, function(err){
            callback(err);
        });
    }
};
