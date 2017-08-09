var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        // /pico/:pico_id/ruleset/:rid
        // -> /pico-ruleset/:pico_id/:rid
        // -> /ruleset-pico/:rid/:pico_id

        var to_batch = [];

        dbRange(ldb, {
            prefix: ["pico"],
        }, function(data){
            if(data.key[2] !== "ruleset"){
                return;
            }
            var pico_id = data.key[1];
            var rid = data.key[3];

            to_batch.push({
                type: "put",
                key: ["pico-ruleset", pico_id, rid],
                value: data.value,
            });
            to_batch.push({
                type: "put",
                key: ["ruleset-pico", pico_id, rid],
                value: data.value,
            });

            to_batch.push({type: "del", key: data.key});

        }, function(err){
            if(err) return callback(err);

            ldb.batch(to_batch, callback);
        });
    },
};
