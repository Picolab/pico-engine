var _ = require("lodash");
var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        // /pico/:pico_id/channel/:eci -> /channel/:eci {... pico_id}
        // /pico-eci-list/:pico_id/:eci true

        var to_batch = [];

        dbRange(ldb, {
            prefix: ["pico"],
        }, function(data){
            if(data.key[2] !== "channel"){
                return;
            }
            var pico_id = data.key[1];
            var eci = data.key[3];

            to_batch.push({
                type: "put",
                key: ["channel", eci],
                value: _.assign({}, data.value, {
                    pico_id: pico_id,
                }),
            });
            to_batch.push({
                type: "put",
                key: ["pico-eci-list", pico_id, eci],
                value: true,
            });

            to_batch.push({type: "del", key: data.key});
            to_batch.push({type: "del", key: ["eci-to-pico_id", eci]});

        }, function(err){
            if(err) return callback(err);

            ldb.batch(to_batch, callback);
        });
    },
};
