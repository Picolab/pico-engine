module.exports = {
    get: function(ctx, core, id, callback){
        core.db.getAppVar(ctx.rid, id, callback);
    },
    set: function(ctx, core, id, value, callback){
        core.db.putAppVar(ctx.rid, id, value, function(err){
            callback(err);
        });
    }
};
