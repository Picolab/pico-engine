module.exports = {
    get: function(ctx, core, id, callback){
        core.db.getEntVar(ctx.pico_id, ctx.rid, id, callback);
    },
    set: function(ctx, core, id, value, callback){
        core.db.putEntVar(ctx.pico_id, ctx.rid, id, value, function(err){
            callback(err);
        });
    }
};
