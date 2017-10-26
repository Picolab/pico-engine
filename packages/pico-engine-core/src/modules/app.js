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
        get: function(ctx, id, callback){
            core.db.getAppVar(ctx.rid, id.var_name, id.query, callback);
        },
        set: function(ctx, id, value, callback){
            if(!id.query){
                core.db.putAppVar(ctx.rid, id.var_name, value, callback);
                return;
            }
            var key = id.var_name;
            var path = toKeyPath(id.query);
            core.db.getAppVar(ctx.rid, key, null, function(err, data){
                if(err) return callback(err);

                var val = _.set(data, path, value);

                core.db.putAppVar(ctx.rid, key, val, callback);
            });
        },
        del: function(ctx, id, callback){
            if(!id.query){
                core.db.delAppVar(ctx.rid, id.var_name, callback);
                return;
            }
            var key = id.var_name;
            var path = toKeyPath(id.query);
            core.db.getAppVar(ctx.rid, key, null, function(err, data){
                if(err) return callback(err);

                var val = _.omit(data, path);

                core.db.putAppVar(ctx.rid, key, val, callback);
            });
        },
    };
};
