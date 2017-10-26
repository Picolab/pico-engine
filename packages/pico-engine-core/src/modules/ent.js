module.exports = function(core){
    return {
        get: function(ctx, id, callback){
            core.db.getEntVar(ctx.pico_id, ctx.rid, id.var_name, id.query, callback);
        },
        set: function(ctx, id, value, callback){
            core.db.putEntVar(ctx.pico_id, ctx.rid, id.var_name, id.query, value, callback);
        },
        del: function(ctx, id, callback){
            core.db.delEntVar(ctx.pico_id, ctx.rid, id.var_name, id.query, callback);
        },
    };
};
