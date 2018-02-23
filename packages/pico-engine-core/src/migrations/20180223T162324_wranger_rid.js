var _ = require("lodash");
var async = require("async");
var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){

        var db_ops = [];

        async.eachSeries([
            // For each of these keypath prefixes, rename the rid
            "pico-ruleset",
            "ruleset-pico",
            "entvars",
            "appvars",
            "state_machine",
            "aggregator_var",
        ], function(prefix, next){
            dbRange(ldb, {
                prefix: [prefix],
            }, function(data){
                var new_key = _.map(data.key, function(p){
                    return p === "io.picolabs.pico"
                        ? "io.picolabs.wrangler"
                        : p;
                });
                if(_.isEqual(data.key, new_key)){
                    return;
                }
                db_ops.push({type: "put", key: new_key, value: data.value});
                db_ops.push({type: "del", key: data.key});
            }, next);
        }, function(err){
            if(err) return callback(err);
            ldb.batch(db_ops, callback);
        });
    },
};
