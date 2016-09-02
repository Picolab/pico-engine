var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var krl = {
  stdlib: require("krl-stdlib"),
  Closure: require("./KRLClosure")
};
var Future = require("fibers/future");
var evalRule = require("./evalRule");
var SymbolTable = require("symbol-table");
var applyInFiber = require("./applyInFiber");
var EventEmitter = require("events");
var selectRulesToEval = require("./selectRulesToEval");

var getArg = function(args, name, index){
  return _.has(args, name)
    ? args[name]
    : args[index];
};
var mkCTX = function(ctx){
  ctx.getArg = getArg;
  ctx.krl = krl;
  return ctx;
};

var rulesets = {};
var salience_graph = {};

var doInstallRuleset = function(rs){
  rs.scope = SymbolTable();
  if(_.isFunction(rs.global)){
    rs.global(mkCTX({
      scope: rs.scope
    }));
  }
  _.each(rs.rules, function(rule){
    rule.rid = rs.rid;

    _.each(rule.select && rule.select.graph, function(g, domain){
      _.each(g, function(exprs, type){
        _.set(salience_graph, [domain, type, rule.rid, rule.name], true);
      });
    });
  });
  rulesets[rs.rid] = rs;
};

var installRuleset = function(rs, callback){
  applyInFiber(doInstallRuleset, null, [rs], callback);
};

module.exports = function(conf){
  var db = Future.wrap(DB(conf.db));
  var compileAndLoadRuleset = conf.compileAndLoadRuleset;

  var emitter = new EventEmitter();
  krl.stdlib.emitter.on("klog", function(val, message){
    emitter.emit("klog", val, message);
  });
  krl.stdlib.emitter.on("debug", function(scope, message){
    emitter.emit("debug", "stdlib", scope, message);
  });

  var mkPersistent = function(pico_id, rid){
    return {
      getEnt: function(key){
        return db.getEntVarFuture(pico_id, rid, key).wait();
      },
      putEnt: function(key, value){
        db.putEntVarFuture(pico_id, rid, key, value).wait();
      },
      getApp: function(key, value){
        return db.getAppVarFuture(rid, key).wait();
      },
      putApp: function(key, value){
        db.putAppVarFuture(rid, key, value).wait();
      }
    };
  };

  var installRID = function(rid, callback){
    if(conf._dont_check_enabled_before_installing){//for testing
      compileAndLoadRuleset({rid: rid}, function(err, rs){
        if(err) return callback(err);
        installRuleset(rs, callback);
      });
      return;
    }
    db.getEnableRuleset(rid, function(err, data){
      if(err) return callback(err);
      compileAndLoadRuleset({
        rid: rid,
        src: data.src,
        hash: data.hash
      }, function(err, rs){
        if(err){
          db.disableRuleset(rid, function(){
            callback(err);
          });
          return;
        }
        installRuleset(rs, callback);
      });
    });
  };

  //TODO standard startup-phase
  db.getAllEnableRulesets(function(err, rids){
    if(err){
      throw err;//TODO handle this somehow?
    }
    _.each(rids, function(rid){
      installRID(rid, function(err){
        if(err){
          throw err;//TODO handle this somehow?
        }
      });
    });
  });

  var signalEvent = function(event, callback){
    event.timestamp = new Date();
    event.getAttr = function(attr_key){
      return event.attrs[attr_key];
    };
    event.getAttrMatches = function(pairs){
      var matches = [];
      var i, attr, m, pair;
      for(i = 0; i < pairs.length; i++){
        pair = pairs[i];
        attr = event.attrs[pair[0]];
        m = pair[1].exec(attr || "");
        if(!m){
          return undefined;
        }
        matches.push(m[1]);
      }
      return matches;
    };
    var debug_info = {
      event: {
        eci: event.eci,
        eid: event.eid,
        domain: event.domain,
        type: event.type,
        attrs: _.cloneDeep(event.attrs),
        timestamp: event.timestamp.toISOString()
      }
    };
    emitter.emit("debug", "event", debug_info, "event recieved");
    db.getPicoByECI(event.eci, function(err, pico){
      if(err) return callback(err);
      if(!pico){
        return callback(new Error("Invalid eci: " + event.eci));
      }
      debug_info.pico_id = pico.id;
      emitter.emit("debug", "event", debug_info, "pico selected");

      var ctx_orig = mkCTX({
        pico: pico,
        db: db,
        engine: engine,
        event: event
      });

      selectRulesToEval(ctx_orig, salience_graph, rulesets, function(err, to_eval){
        if(err) return callback(err);

        λ.map(_.groupBy(to_eval, "rid"), function(rules_by_rid, callback){
          λ.map.series(rules_by_rid, function(rule, callback){

            var rule_debug_info = _.assign({}, debug_info, {
              rid: rule.rid,
              rule_name: rule.name
            });

            var ctx = _.assign({}, ctx_orig, {
              rid: rule.rid,
              rule: rule,
              persistent: mkPersistent(pico.id, rule.rid),
              scope: rule.scope,
              emitDebug: function(msg){
                emitter.emit("debug", "event", rule_debug_info, msg);
              }
            });

            ctx.emitDebug("rule selected");

            evalRule(rule, ctx, callback);
          }, callback);
        }, function(err, responses){
          if(err) return callback(err);

          var res_by_type = _.groupBy(_.flattenDeep(_.values(responses)), "type");

          //TODO other types
          callback(undefined, {
            directives:  _.map(res_by_type.directive, function(d){
              return _.omit(d, "type");
            })
          });
        });
      });
    });
  };

  var future_wraps = Future.wrap({
    installRID: installRID,
    signalEvent: signalEvent
  });
  //This is the built in KRL module `engine`
  var engine = {
    newPico: function(opts){
      return db.newPicoFuture(opts).wait();
    },
    removePico: function(id) {
      return db.removePicoFuture(id).wait();
    },
    newChannel: function(opts){
      return db.newChannelFuture(opts).wait();
    },
    addRuleset: function(opts){
      return db.addRulesetFuture(opts).wait();
    },
    installRID: function(rid){
      return future_wraps.installRIDFuture(rid).wait();
    },
    signalEvent: function(event){
      return future_wraps.signalEventFuture(event).wait();
    }
  };

  return {
    db: db,
    emitter: emitter,
    isInstalled: function(rid){
      return _.has(rulesets, rid);
    },
    installRID: installRID,
    signalEvent: signalEvent,
    runQuery: function(query, callback){
      db.getPicoByECI(query.eci, function(err, pico){
        if(err) return callback(err);
        if(!pico){
          return callback(new Error("Bad eci"));
        }
        if(!_.has(pico.ruleset, query.rid)){
          return callback(new Error("Pico does not have that rid"));
        }
        if(!_.has(rulesets, query.rid)){
          return callback(new Error("Not found: rid"));
        }
        var rs = rulesets[query.rid];
        var shares = _.get(rs, ["meta", "shares"]);
        if(!_.isArray(shares) || !_.includes(shares, query.name)){
          return callback(new Error("Not shared"));
        }
        if(!rs.scope.has(query.name)){
          //TODO throw -or- nil????
          return callback(new Error("Shared, but not defined: " + query.name));
        }

        ////////////////////////////////////////////////////////////////////////
        var ctx = mkCTX({
          db: db,
          rid: rs.rid,
          pico: pico,
          engine: engine,
          persistent: mkPersistent(pico.id, rs.rid),
          scope: rs.scope
        });
        var val = ctx.scope.get(query.name);
        if(_.isFunction(val)){
          applyInFiber(val, null, [ctx, query.args], function(err, resp){
            if(err) return callback(err);
            callback(undefined, resp);
          });
        }else{
          callback(undefined, val);
        }
      });
    }
  };
};
