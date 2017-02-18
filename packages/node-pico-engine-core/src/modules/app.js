module.exports = {
    get: function(ctx, id, callback){
        ctx.db.getAppVar(ctx.rid, id, callback);
    },
    set: function(ctx, id, value, callback){
        ctx.db.putAppVar(ctx.rid, id, value, function(err){
            callback(err);
        });
    }
};
