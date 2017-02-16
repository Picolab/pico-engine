module.exports = {
    get: function(ctx, id){
        return ctx.db.getAppVarFuture(ctx.rid, id).wait();
    },
    set: function(ctx, id, value){
        ctx.db.putAppVarFuture(ctx.rid, id, value).wait();
    }
};
