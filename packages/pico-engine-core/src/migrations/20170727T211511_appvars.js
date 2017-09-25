var dbRange = require("../dbRange");

module.exports = {
    up: function(ldb, callback){
        // /resultset/:rid/vars/:varname -> /appvars/:rid/:varname

        var to_batch = [];

        dbRange(ldb, {
            prefix: ["resultset"],
        }, function(data){
            if(data.key[2] !== "vars"){
                return;
            }
            var rid = data.key[1];
            var varname = data.key[3];

            to_batch.push({
                type: "put",
                key: ["appvars", rid, varname],
                value: data.value,
            });

            to_batch.push({type: "del", key: data.key});

        }, function(err){
            if(err) return callback(err);

            ldb.batch(to_batch, callback);
        });
    },
};
