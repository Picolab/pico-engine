var _ = require("lodash");
var ktypes = require("krl-stdlib/types");

//coerce the value into an array of key strings
var toKeyPath = function(path){
    if(!ktypes.isArray(path)){
        path = [path];
    }
    return _.map(path, function(key){
        return ktypes.toString(key);
    });
};

module.exports = function(core){
    return {
        get: function(ctx, id, path, callback){
            if(ktypes.isNull(path)){
                core.db.getEntVar(ctx.pico_id, ctx.rid, id, callback);
                return;
            }
            path = toKeyPath(path);
            core.db.getEntVar(ctx.pico_id, ctx.rid, id, function(err, data){
                if(err) return callback(err);
                callback(null, _.get(data, path));
            });
        },
        set: function(ctx, id, path, value, callback){
            if(ktypes.isNull(path)){
                core.db.putEntVar(ctx.pico_id, ctx.rid, id, value, function(err){
                    callback(err);
                });
                return;
            }
            path = toKeyPath(path);
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
