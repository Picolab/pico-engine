var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var getArg = require("./getArg");
var Future = require("fibers/future");
var modules = require("./modules");
var PicoQueue = require("./PicoQueue");
var krl_stdlib = require("krl-stdlib");
var KRLClosure = require("./KRLClosure");
var SymbolTable = require("symbol-table");
var applyInFiber = require("./applyInFiber");
var EventEmitter = require("events");
var runQueryInFiber = require("./runQueryInFiber");
var signalEventInFiber = require("./signalEventInFiber");

module.exports = function(conf, callback){
  var db = Future.wrap(DB(conf.db));
  var compileAndLoadRuleset = conf.compileAndLoadRuleset;

  var rulesets = {};
  var salience_graph = {};

  var emitter = new EventEmitter();

  var mkCTX = function(ctx){
    ctx.db = db;
    ctx.getArg = getArg;
    ctx.engine = engine;
    ctx.modules = modules;
    ctx.rulesets = rulesets;
    ctx.salience_graph = salience_graph;
    ctx.KRLClosure = KRLClosure;
    ctx.emit = function(type, val, message){//for stdlib
      var info = {rid: ctx.rid};
      if(ctx.event){
        info.event = {
          eci: ctx.event.eci,
          eid: ctx.event.eid,
          domain: ctx.event.domain,
          type: ctx.event.type,
        };
      }
      emitter.emit(type, info, val, message);
    };
    ctx.callKRLstdlib = function(fn_name){
      var args = _.toArray(arguments);
      args[0] = ctx;
      return krl_stdlib[fn_name].apply(void 0, args);
    };
    return ctx;
  };

  var installRulesetInFiber = function(rs, loadDepRS){
    rs.scope = SymbolTable();
    var ctx = mkCTX({
      rid: rs.rid,
      scope: rs.scope
    });
    if(_.isFunction(rs.meta && rs.meta.configure)){
      rs.meta.configure(ctx);
    }
    if(_.isFunction(rs.global)){
      rs.global(ctx);
    }
    rs.modules_used = {};
    _.each(rs.meta && rs.meta.use, function(use){
      if(use.kind !== "module"){
        throw new Error("Unsupported 'use' kind: " + use.kind);
      }
      var dep_rs = loadDepRS(use.rid);
      if(!dep_rs){
        throw new Error("Dependant module not loaded: " + use.rid);
      }
      var ctx = mkCTX({
        rid: dep_rs.rid,
        scope: SymbolTable()//or dep_rs.scope.push() ??? TODO
      });
      if(_.isFunction(dep_rs.meta && dep_rs.meta.configure)){
        dep_rs.meta.configure(ctx);
      }
      if(_.isFunction(use["with"])){
        use["with"](ctx);
      }
      if(_.isFunction(dep_rs.global)){
        dep_rs.global(ctx);
      }
      rs.modules_used[use.alias] = {
        rid: use.rid,
        scope: ctx.scope,
        provides: dep_rs.meta.provides
      };
    });
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

  var installRuleset = function(rs, loadDepRS, callback){
    applyInFiber(installRulesetInFiber, null, [rs, loadDepRS], callback);
  };

  var getRulesetForRID = function(rid, callback){
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
        callback(void 0, rs);
      });
    });
  };

  var installRID = function(rid, callback){
    getRulesetForRID(rid, function(err, rs){
      if(err) return callback(err);
      installRuleset(rs, function(rid){
        return rulesets[rid];
      }, callback);
    });
  };

  var picoQ = PicoQueue(function(pico_id, data, callback){
    var ctx;
    if(data.type === "event"){
      var event = data.event;
      event.timestamp = new Date(event.timestamp);
      ctx = mkCTX({event: event});
      applyInFiber(signalEventInFiber, void 0, [ctx, pico_id], function(err, data){
        if(err) return callback(err);
        if(_.has(data, "event:send")){
          _.each(data["event:send"], function(o){
            picoQ.enqueue(pico_id, {
              type: "event",
              event: o.event
            }, _.noop);
          });
          data = _.omit(data, "event:send");
        }
        callback(void 0, data);
      });
      return;
    }else if(data.type === "query"){
      ctx = mkCTX({query: data.query});
      applyInFiber(runQueryInFiber, void 0, [ctx, pico_id], callback);
      return;
    }
    callback(new Error("invalid PicoQueue type:" + data.type));
  });

  var signalEvent = function(event, callback){
    event.timestamp = new Date();

    var emit = mkCTX({event: event}).emit;
    emit("debug", "event recieved");

    db.getPicoIDByECI(event.eci, function(err, pico_id){
      if(err) return callback(err);
      picoQ.enqueue(pico_id, {
        type: "event",
        event: event
      }, callback);
      emit("debug", "event added to pico queue: " + pico_id);
    });
  };

  var runQuery = function(query, callback){
    var emit = mkCTX({query: query}).emit;
    emit("debug", "query recieved");

    db.getPicoIDByECI(query.eci, function(err, pico_id){
      if(err) return callback(err);
      picoQ.enqueue(pico_id, {
        type: "query",
        query: query
      }, callback);
      emit("debug", "query added to pico queue: " + pico_id);
    });
  };

  var engine = Future.wrap({
    installRID: installRID,
    signalEvent: signalEvent
  });

  var installAllEnableRulesets = function(callback){
    db.getAllEnableRulesets(function(err, rids){
      if(err)return callback(err);
      λ.map(rids, getRulesetForRID, function(err, rs_list){
        if(err)return callback(err);
        var rs_by_rid = {};
        _.each(rs_list, function(rs){
          rs_by_rid[rs.rid] = rs;
        });
        var loadDepRS = function(rid){
          return rs_by_rid[rid];
        };
        λ.each(rs_list, function(rs, next){
          installRuleset(rs, loadDepRS, next);
        }, callback);
      });
    });
  };

  installAllEnableRulesets(function(err){
    if(err) return callback(err);
    callback(void 0, {
      db: db,
      emitter: emitter,
      isInstalled: function(rid){
        return _.has(rulesets, rid);
      },
      installRID: installRID,
      signalEvent: signalEvent,
      runQuery: runQuery
    });
  });
};
