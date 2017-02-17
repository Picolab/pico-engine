module.exports = {
    get: function(ctx, id){
        return ctx.db.getAppVarFuture(ctx.rid, id).wait();
    },
    set: function(ctx, id, value, callback){
        ctx.db.putAppVar(ctx.rid, id, value, function(err){
            callback(err);
        });
    }
};
