var _ = require("lodash");
var cuid = require("cuid");
var crypto = require("crypto");
var levelup = require("levelup");
var bytewise = require("bytewise");
var safeJsonCodec = require("level-json-coerce-null");
var extractRulesetID = require("./extractRulesetID");

var dbRange = function(ldb, opts, onData, callback_orig){
    var has_calledback = false;
    var callback = function(){
        if(has_calledback) return;
        has_calledback = true;
        callback_orig.apply(this, arguments);
    };

    if(_.has(opts, "prefix")){
        opts = _.assign({}, opts, {
            gte: opts.prefix,
            lte: opts.prefix.concat([undefined])//bytewise sorts with null at the bottom and undefined at the top
        });
        delete opts.prefix;
    }
    ldb.createReadStream(opts)
        .on("data", onData)
        .on("error", function(err){
            callback(err);
        })
        .on("end", callback);
};

module.exports = function(opts){

    var ldb = levelup(opts.location, {
        db: opts.db,
        keyEncoding: bytewise,
        valueEncoding: safeJsonCodec
    });

    var newID = _.isFunction(opts.newID) ? opts.newID : cuid;

    return {
        toObj: function(callback){
            var db_data = {};
            dbRange(ldb, {}, function(data){
                if(!_.isArray(data.key)){
                    return;
                }
                _.set(db_data, data.key, data.value);
            }, function(err){
                callback(err, db_data);
            });
        },
        getPicoIDByECI: function(eci, callback){
            ldb.get(["channel", eci, "pico_id"], callback);
        },
        getOwnerECI: function(callback){
            var eci = undefined;
            dbRange(ldb, {
                prefix: ["channel"],
                values: false,
                limit: 1
            }, function(key){
                eci = key[1];
            }, function(err){
                callback(err, eci);
            });
        },
        getPico: function(id, callback){
            var pico = {};
            dbRange(ldb, {
                prefix: ["pico", id]
            }, function(data){
                _.set(pico, data.key, data.value);
            }, function(err){
                callback(err, pico.pico[id]);
            });
        },
        newPico: function(opts, callback){
            var new_pico = {
                id: newID()
            };
            ldb.put(["pico", new_pico.id], new_pico, function(err){
                if(err) return callback(err);
                callback(undefined, new_pico);
            });
        },
        removePico: function(id, callback){
            var to_batch = [];
            dbRange(ldb, {
                prefix: ["pico", id],
                values: false
            }, function(key){
                to_batch.push({type: "del", key: key});
                if(key[2] === "channel"){
                    //remove this index
                    to_batch.push({type: "del", key: ["channel", key[3], "pico_id"]});
                }
            }, function(err){
                if(err)return callback(err);
                ldb.batch(to_batch, callback);
            });
        },
        newChannel: function(opts, callback){
            var new_channel = {
                id: newID(),
                name: opts.name,
                type: opts.type
            };
            var ops = [
                {
                    //the source of truth for a channel
                    type: "put",
                    key: ["pico", opts.pico_id, "channel", new_channel.id],
                    value: new_channel
                },
                {
                    //index to get pico_id by eci
                    type: "put",
                    key: ["channel", new_channel.id, "pico_id"],
                    value: opts.pico_id
                }
            ];
            ldb.batch(ops, function(err){
                if(err) return callback(err);
                callback(undefined, new_channel);
            });
        },
        addRuleset: function(opts, callback){
            ldb.put(["pico", opts.pico_id, "ruleset", opts.rid], {on: true}, callback);
        },
        removeRuleset: function(pico_id, rid, callback){
            ldb.del(["pico", pico_id, "ruleset", rid], callback);
        },
        removeChannel: function(pico_id, eci, callback){
            var ops = [
                {type: "del", key: ["pico", pico_id, "channel", eci]},
                {type: "del", key: ["channel", eci, "pico_id"]}
            ];
            ldb.batch(ops, callback);
        },
        putEntVar: function(pico_id, rid, var_name, val, callback){
            ldb.put(["pico", pico_id, rid, "vars", var_name], val, callback);
        },
        getEntVar: function(pico_id, rid, var_name, callback){
            ldb.get(["pico", pico_id, rid, "vars", var_name], function(err, data){
                if(err && err.notFound){
                    return callback();
                }
                callback(err, data);
            });
        },
        putAppVar: function(rid, var_name, val, callback){
            ldb.put(["resultset", rid, "vars", var_name], val, callback);
        },
        getAppVar: function(rid, var_name, callback){
            ldb.get(["resultset", rid, "vars", var_name], function(err, data){
                if(err && err.notFound){
                    return callback();
                }
                callback(err, data);
            });
        },
        getStateMachineState: function(pico_id, rule, callback){
            var key = ["state_machine", pico_id, rule.rid, rule.name];
            ldb.get(key, function(err, curr_state){
                if(err){
                    if(err.notFound){
                        curr_state = undefined;
                    }else{
                        return callback(err);
                    }
                }
                callback(undefined, _.has(rule.select.state_machine, curr_state)
                        ? curr_state
                        : "start");
            });
        },
        putStateMachineState: function(pico_id, rule, state, callback){
            var key = ["state_machine", pico_id, rule.rid, rule.name];
            ldb.put(key, state || "start", callback);
        },

        getStateMachineStartTime: function(pico_id, rule, callback){
            var key = ["state_machine_starttime", pico_id, rule.rid, rule.name];
            ldb.get(key, function(err, time){
                if(err){
                    if(err.notFound){
                        time = undefined;
                    }else{
                        return callback(err);
                    }
                }
                callback(undefined, time);
            });
        },
        putStateMachineStartTime: function(pico_id, rule, time, callback){
            var key = ["state_machine_starttime", pico_id, rule.rid, rule.name];
            ldb.put(key, time, callback);
        },

        updateAggregatorVar: function(pico_id, rule, var_key, updater, callback){
            var key = [
                "aggregator_var",
                pico_id,
                rule.rid,
                rule.name,
                var_key
            ];
            ldb.get(key, function(err, val){
                if(err && !err.notFound){
                    return callback(err);
                }
                if(!_.isArray(val)){
                    val = [];
                }
                val = updater(val);
                if(!_.isArray(val)){
                    val = [];
                }
                ldb.put(key, val, function(err){
                    callback(err, val);
                });
            });
        },
        storeRuleset: function(krl_src, meta, callback){
            var timestamp = (new Date()).toISOString();
            if(arguments.length === 4 && _.isString(arguments[3])){//for testing only
                timestamp = arguments[3];//for testing only
            }//for testing only

            var rid = extractRulesetID(krl_src);
            if(!rid){
                callback(new Error("Ruleset name not found"));
                return;
            }
            var shasum = crypto.createHash("sha256");
            shasum.update(krl_src);
            var hash = shasum.digest("hex");

            var url = _.has(meta, "url") && _.isString(meta.url)
                ? meta.url.toLowerCase().trim()
                : null;

            var ops = [
                {
                    //the source of truth for a ruleset version
                    type: "put",
                    key: ["rulesets", "krl", hash],
                    value: {
                        src: krl_src,
                        rid: rid,
                        url: url,
                        timestamp: timestamp
                    }
                },
                {
                    //index to view all the versions of a given ruleset name
                    type: "put",
                    key: ["rulesets", "versions", rid, timestamp, hash],
                    value: true
                }
            ];
            if(url){
                //index to lookup by url
                ops.push({
                    type: "put",
                    key: ["rulesets", "url", url, rid, hash],
                    value: true
                });
            }
            ldb.batch(ops, function(err){
                if(err) return callback(err);
                callback(undefined, hash);
            });
        },
        enableRuleset: function(hash, callback){
            ldb.get(["rulesets", "krl", hash], function(err, data){
                if(err) return callback(err);
                ldb.put(["rulesets", "enabled", data.rid], {
                    hash: hash,
                    timestamp: (new Date()).toISOString()
                }, callback);
            });
        },
        disableRuleset: function(rid, callback){
            ldb.del(["rulesets", "enabled", rid], callback);
        },
        getEnabledRuleset: function(rid, callback){
            ldb.get(["rulesets", "enabled", rid], function(err, data_e){
                if(err) return callback(err);
                ldb.get(["rulesets", "krl", data_e.hash], function(err, data_k){
                    if(err) return callback(err);
                    callback(undefined, {
                        src: data_k.src,
                        hash: data_e.hash,
                        rid: data_k.rid,
                        timestamp_stored: data_k.timestamp,
                        timestamp_enable: data_e.timestamp
                    });
                });
            });
        },
        getAllEnabledRulesets: function(callback){
            var rids = [];
            dbRange(ldb, {
                prefix: ["rulesets", "enabled"],
                values: false
            }, function(key){
                rids.push(key[2]);
            }, function(err){
                callback(err, rids);
            });
        }
    };
};
