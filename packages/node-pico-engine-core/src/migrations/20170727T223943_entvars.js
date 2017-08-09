var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        // /pico/:pico_id/:rid/vars/:varname -> /entvars/:pico_id/:rid/:varname

        var to_batch = [];

        dbRange(ldb, {
            prefix: ["pico"],
        }, function(data){
            if(data.key[3] !== "vars"){
                return;
            }
            var pico_id = data.key[1];
            var rid = data.key[2];
            var varname = data.key[4];

            to_batch.push({
                type: "put",
                key: ["entvars", pico_id, rid, varname],
                value: data.value,
            });

            to_batch.push({type: "del", key: data.key});

        }, function(err){
            if(err) return callback(err);

            ldb.batch(to_batch, callback);
        });
    },
};
