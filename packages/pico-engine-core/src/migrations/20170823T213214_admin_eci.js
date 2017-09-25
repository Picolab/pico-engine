var _ = require("lodash");
var dbRange = require("../dbRange");
var sovrinDID = require("sovrin-did");

var newChannel_base = function(opts){
    var did = sovrinDID.gen();
    var channel = {
        id: did.did,
        pico_id: opts.pico_id,
        name: opts.name,
        type: opts.type,
        sovrin: did,
    };
    var db_ops = [
        {
            type: "put",
            key: ["channel", channel.id],
            value: channel,
        },
        {
            type: "put",
            key: ["pico-eci-list", channel.pico_id, channel.id],
            value: true,
        }
    ];
    return {
        channel: channel,
        db_ops: db_ops,
    };
};

module.exports = {
    up: function(ldb, callback){
        var db_ops = [];

        ldb.get(["root_pico"], function(err, root_pico){
            if(err){
                if(err.notFound){
                    root_pico = {};
                }else{
                    return callback(err);
                }
            }

            dbRange(ldb, {
                prefix: ["pico"],
            }, function(data){
                var pico_id = data.key[1];

                var c = newChannel_base({
                    pico_id: pico_id,
                    name: "admin",
                    type: "secret",
                });

                db_ops = db_ops.concat(c.db_ops);

                var pico = _.assign({}, data.value, {
                    admin_eci: c.channel.id,
                });

                db_ops.push({
                    type: "put",
                    key: ["pico", pico_id],
                    value: pico,
                });

                if(root_pico.id === pico_id){
                    db_ops.push({
                        type: "put",
                        key: ["root_pico"],
                        value: pico,
                    });
                }

            }, function(err){
                if(err) return callback(err);

                ldb.batch(db_ops, callback);
            });
        });
    },
};
