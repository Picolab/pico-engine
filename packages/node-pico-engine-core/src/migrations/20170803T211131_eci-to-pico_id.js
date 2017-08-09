var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        // /channel/:eci/pico_id -> /eci-to-pico_id/:eci

        var to_batch = [];

        dbRange(ldb, {
            prefix: ["channel"],
        }, function(data){
            if(data.key[2] !== "pico_id"){
                return;
            }
            var eci = data.key[1];

            to_batch.push({
                type: "put",
                key: ["eci-to-pico_id", eci],
                value: data.value,
            });

            to_batch.push({type: "del", key: data.key});

        }, function(err){
            if(err) return callback(err);

            ldb.batch(to_batch, callback);
        });
    },
};
