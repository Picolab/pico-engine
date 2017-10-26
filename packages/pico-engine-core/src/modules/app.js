module.exports = function(core){
    return {
        get: function(ctx, id, callback){
            core.db.getAppVar(ctx.rid, id.var_name, id.query, callback);
        },
        set: function(ctx, id, value, callback){
            core.db.putAppVar(ctx.rid, id.var_name, id.query, value, callback);
        },
        del: function(ctx, id, callback){
            core.db.delAppVar(ctx.rid, id.var_name, id.query, callback);
        },
    };
};
