var _ = require("lodash");
var ktypes = require("krl-stdlib/types");

module.exports = function(core){
    return {
        get: function(ctx, id, path, callback){
            core.db.getEntVar(ctx.pico_id, ctx.rid, id, callback);
        },
        set: function(ctx, id, path, value, callback){
            if(ktypes.isNull(path)){
                core.db.putEntVar(ctx.pico_id, ctx.rid, id, value, function(err){
                    callback(err);
                });
                return;
            }
            core.db.getEntVar(ctx.pico_id, ctx.rid, id, function(err, data){
                if(err) return callback(err);

                if( ! ktypes.isArray(path)){
                    path = [path];
                }
                var val = _.set(data, path, value);

                core.db.putEntVar(ctx.pico_id, ctx.rid, id, val, function(err){
                    callback(err);
                });
            });
        },
        del: function(ctx, id, path, callback){
            core.db.removeEntVar(ctx.pico_id, ctx.rid, id, function(err){
                callback(err);
            });
        },
    };
};
