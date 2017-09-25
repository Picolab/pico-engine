var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        // /entvars/:pico_id/io.picolabs.pico/parent
        // /entvars/:pico_id/io.picolabs.pico/children

        var to_batch = [];

        dbRange(ldb, {
            prefix: ["entvars"],
        }, function(data){

            var pico_id = data.key[1];

            if(data.key[2] !== "io.picolabs.pico"){
                return;
            }
            if(data.key[3] === "parent"){

                var parent_id = data.value.id;

                to_batch.push({
                    type: "put",
                    key: ["pico", pico_id],
                    value: {
                        id: pico_id,
                        parent_id: parent_id,
                    },
                });
                to_batch.push({
                    type: "put",
                    key: ["pico-children", parent_id, pico_id],
                    value: true,
                });

            }

        }, function(err){
            if(err) return callback(err);

            dbRange(ldb, {
                prefix: ["channel"],
                limit: 1,//the old schema relied on the first eci to be root
            }, function(data){
                to_batch.push({
                    type: "put",
                    key: ["root_pico"],
                    value: {
                        id: data.value.pico_id,
                        eci: data.value.id,
                    }
                });
            }, function(err){
                if(err) return callback(err);

                ldb.batch(to_batch, callback);
            });
        });
    },
};
