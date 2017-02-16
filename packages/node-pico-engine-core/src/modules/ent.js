module.exports = {
    get: function(ctx, id){
        return ctx.db.getEntVarFuture(ctx.pico_id, ctx.rid, id).wait();
    },
    set: function(ctx, id, value){
        ctx.db.putEntVarFuture(ctx.pico_id, ctx.rid, id, value).wait();
    }
};
