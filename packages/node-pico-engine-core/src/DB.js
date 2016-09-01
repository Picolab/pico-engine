var _ = require("lodash");
var cuid = require("cuid");
var crypto = require("crypto");
var levelup = require("levelup");
var bytewise = require("bytewise");
var safeJsonCodec = require("level-json-coerce-null");
var extractRulesetName = require("./extractRulesetName");

var dbToObj = function(ldb, callback){
  var db_data = {};
  ldb.createReadStream()
    .on("data", function(data){
      if(!_.isArray(data.key)){
        return;
      }
      _.set(db_data, data.key, data.value);
    })
    .on("end", function(){
      callback(undefined, db_data);
    });
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
      dbToObj(ldb, callback);
    },
    getPicoByECI: function(eci, callback){
      var db_data = {};
      ldb.createReadStream()
        .on("data", function(data){
          if(!_.isArray(data.key)){
            return;
          }
          _.set(db_data, data.key, data.value);
        })
      .on("end", function(){
        var da_pico = undefined;
        _.each(db_data.pico, function(pico, pico_id){
          if(_.has(pico.channel, eci)){
            da_pico = pico;
          }
        });
        callback(undefined, da_pico);
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
      ldb.createKeyStream({
        gte: ["pico", id],
        lte: ["pico", id, undefined]//bytewise sorts with null at the bottom and undefined at the top
      })
        .on("error", function(err){
          callback(err);
        })
        .on("data", function(key){
          to_batch.push({type: "del", key: key});
        })
        .on("end", function(){
          ldb.batch(to_batch, callback);
        });
    },
    newChannel: function(opts, callback){
      var new_channel = {
        id: newID(),
        name: opts.name,
        type: opts.type
      };
      var key = ["pico", opts.pico_id, "channel", new_channel.id];
      ldb.put(key, new_channel, function(err){
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
      ldb.del(["pico", pico_id, "channel", eci], callback);
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
      var key = ["state_machine", pico_id, rule.rid, rule.rule_name];
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
      var key = ["state_machine", pico_id, rule.rid, rule.rule_name];
      ldb.put(key, state || "start", callback);
    },
    registerRuleset: function(krl_src, callback){
      var timestamp = (new Date()).toISOString();
      if(arguments.length === 3 && _.isString(arguments[2])){//for testing only
        timestamp = arguments[2];//for testing only
      }//for testing only

      var rid = extractRulesetName(krl_src);
      if(!rid){
        callback(new Error("Ruleset name not found"));
        return;
      }
      var shasum = crypto.createHash("sha256");
      shasum.update(krl_src);
      var hash = shasum.digest("hex");

      var ops = [
        {
          //the source of truth for a ruleset version
          type: "put",
          key: ["rulesets", "krl", hash],
          value: {
            src: krl_src,
            rid: rid,
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
    getEnableRuleset: function(rid, callback){
      ldb.get(["rulesets", "enabled", rid], function(err, data_e){
        if(err) return callback(err);
        ldb.get(["rulesets", "krl", data_e.hash], function(err, data_k){
          if(err) return callback(err);
          callback(undefined, {
            src: data_k.src,
            hash: data_e.hash,
            rid: data_k.rid,
            timestamp_register: data_k.timestamp,
            timestamp_enable: data_e.timestamp
          });
        });
      });
    },
    getAllEnableRulesets: function(callback){
      //TODO optimize
      dbToObj(ldb, function(err, db){
        if(err) return callback(err);
        var enabled = _.get(db, ["rulesets", "enabled"], {});
        callback(undefined, _.keys(enabled));
      });
    }
  };
};
