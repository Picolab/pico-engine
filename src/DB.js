var _ = require("lodash");
var cuid = require("cuid");
var crypto = require("crypto");
var levelup = require("levelup");
var bytewise = require("bytewise");
var extractRulesetName = require("krl-parser/src/extractRulesetName");

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

  var ldb = opts.path
    ? levelup(opts.path, {
      keyEncoding: bytewise,
      valueEncoding: "json"
    })
    : levelup({
      db: opts.db,
      keyEncoding: bytewise,
      valueEncoding: "json"
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
    putEntVar: function(pico_id, var_name, val, callback){
      ldb.put(["pico", pico_id, "vars", var_name], val, callback);
    },
    getEntVar: function(pico_id, var_name, callback){
      ldb.get(["pico", pico_id, "vars", var_name], callback);
    },
    putAppVar: function(rid, var_name, val, callback){
      ldb.put(["resultset", rid, "vars", var_name], val, callback);
    },
    getAppVar: function(rid, var_name, callback){
      ldb.get(["resultset", rid, "vars", var_name], callback);
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

      var rs_name = extractRulesetName(krl_src);
      if(!rs_name){
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
            rs_name: rs_name,
            timestamp: timestamp
          }
        },
        {
          //index to view all the versions of a given ruleset name
          type: "put",
          key: ["rulesets", "versions", rs_name, timestamp, hash],
          value: true
        }
      ];
      ldb.batch(ops, function(err){
        if(err) return callback(err);
        callback(undefined, hash);
      });
    },
    installRuleset: function(hash, callback){
      ldb.get(["rulesets", "krl", hash], function(err, data){
        if(err) return callback(err);
        ldb.put(["rulesets", "installed", data.rs_name], {
          hash: hash,
          timestamp: (new Date()).toISOString()
        }, callback);
      });
    }
  };
};
