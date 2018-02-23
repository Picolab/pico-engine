var _ = require("lodash");
var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){

        var db_ops = [];

        var new_data = {};

        dbRange(ldb, {
            prefix: ["state_machine"],
        }, function(data){
            var pico_id = data.key[1];
            var rid = data.key[2];
            var rule_name = data.key[3];

            _.set(new_data, [pico_id, rid, rule_name, "state"], data.value);
        }, function(err){
            if(err) return callback(err);

            dbRange(ldb, {
                prefix: ["state_machine_starttime"],
            }, function(data){
                var pico_id = data.key[1];
                var rid = data.key[2];
                var rule_name = data.key[3];

                _.set(new_data, [pico_id, rid, rule_name, "starttime"], data.value);

                db_ops.push({type: "del", key: data.key});

            }, function(err){
                if(err) return callback(err);

                _.each(new_data, function(data, pico_id){
                    _.each(data, function(data, rid){
                        _.each(data, function(value, rule_name){
                            db_ops.push({
                                type: "put",
                                key: ["state_machine", pico_id, rid, rule_name],
                                value: value,
                            });
                        });
                    });
                });
                ldb.batch(db_ops, callback);
            });
        });
    },
};
