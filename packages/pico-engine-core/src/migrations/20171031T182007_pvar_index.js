var _ = require("lodash");
var ktypes = require("krl-stdlib/types");
var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        var db_ops = [];

        var onKV = function(data){
            var key_prefix = data.key;
            var val = data.value;

            var index_type = ktypes.typeOf(val);
            if(index_type === "Map" || index_type === "Array"){
                db_ops.push({
                    type: "put",
                    key: key_prefix,
                    value: {type: index_type},
                });
                _.each(val, function(v, k){
                    db_ops.push({
                        type: "put",
                        key: key_prefix.concat(["value", k]),
                        value: v,
                    });
                });
            }else{
                if(index_type === "Null"){
                    val = null;
                }
                if(index_type === "Function" || index_type === "Action"){
                    val = ktypes.toString(val);
                }
                db_ops.push({
                    type: "put",
                    key: key_prefix,
                    value: {
                        type: index_type,
                        value: val,
                    },
                });
            }
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
