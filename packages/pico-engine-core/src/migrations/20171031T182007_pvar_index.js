var _ = require("lodash");
var ktypes = require("krl-stdlib/types");
var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        var db_ops = [];

        var onKV = function(data){
            var key_prefix = data.key;
            var val = data.value;

            //NOTE: not sharing code with DB.js b/c migrations should be immutable
            //i.e. produce the same result regardless of previous codebase states
            var index_type = ktypes.typeOf(val);
            var root_value = {type: index_type};
            switch(index_type){
            case "Null":
                root_value.value = null;
                break;
            case "Function":
            case "Action":
                root_value.type = "String";
                root_value.value = ktypes.toString(val);
                break;
            case "Map":
            case "Array":
                _.each(val, function(v, k){
                    db_ops.push({
                        type: "put",
                        key: key_prefix.concat(["value", k]),
                        value: v,
                    });
                });
                break;
            default:
                root_value.value = val;
            }
            db_ops.push({
                type: "put",
                key: key_prefix,
                value: root_value,
            });
        };

        dbRange(ldb, {
            prefix: ["entvars"],
        }, onKV, function(err){
            if(err) return callback(err);

            dbRange(ldb, {
                prefix: ["appvars"],
            }, onKV, function(err){
                if(err) return callback(err);

                ldb.batch(db_ops, callback);
            });
        });
    },
};
