module.exports = {
    get: function(ctx, id){
        return ctx.db.getEntVarFuture(ctx.pico_id, ctx.rid, id).wait();
    },
    set: function(ctx, id, value, callback){
        ctx.db.putEntVar(ctx.pico_id, ctx.rid, id, value, function(err){
            callback(err);
        });
    }
};
