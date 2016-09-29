var _ = require("lodash");
var λ = require("contra");
var DB = require("./DB");
var getArg = require("./getArg");
var Future = require("fibers/future");
var modules = require("./modules");
var krl_stdlib = require("krl-stdlib");
var KRLClosure = require("./KRLClosure");
var SymbolTable = require("symbol-table");
var applyInFiber = require("./applyInFiber");
var EventEmitter = require("events");
var evalRuleInFiber = require("./evalRuleInFiber");
var selectRulesToEvalFuture = Future.wrap(require("./selectRulesToEval"));

module.exports = function(conf){
  var db = Future.wrap(DB(conf.db));
  var compileAndLoadRuleset = conf.compileAndLoadRuleset;

  var rulesets = {};
  var salience_graph = {};

  var emitter = new EventEmitter();

  var mkCTX = function(ctx){
    ctx.db = db;
    ctx.getArg = getArg;
    ctx.modules = modules;
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

  var installRulesetInFiber = function(rs){
    rs.scope = SymbolTable();
    var ctx = mkCTX({
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
      if(!_.has(rulesets, use.rid)){
        throw new Error("Dependant module not loaded: " + use.rid);
      }
      var dep_rs = rulesets[use.rid];
      var ctx = mkCTX({
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

  var installRuleset = function(rs, callback){
    applyInFiber(installRulesetInFiber, null, [rs], callback);
  };

  var getRulesetForRID = function(rid, callback){
    if(conf._dont_check_enabled_before_installing){//for testing
      compileAndLoadRuleset({rid: rid}, callback);
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
        callback(void 0, rs);
      });
    });
  };

  var installRID = function(rid, callback){
    getRulesetForRID(rid, function(err, rs){
      if(err) return callback(err);
      installRuleset(rs, callback);
    });
  };

  //TODO standard startup-phase
  db.getAllEnableRulesets(function(err, rids){
    if(err){
      throw err;//TODO handle this somehow?
    }
    λ.map(rids, getRulesetForRID, function(err, rs_list){
      if(err){
        throw err;//TODO handle this somehow?
      }
      //TODO load in order of dependancies? or simply index all then install?
      _.each(rs_list, function(rs){
        installRuleset(rs, function(err){
          if(err){
            throw err;//TODO handle this somehow?
          }
        });
      });
    });
  });

  var signalEventInFiber = function(event){
    event.timestamp = new Date();

    var ctx = mkCTX({
      engine: engine,
      event: event
    });

    ctx.emit("debug", "event recieved");

    ctx.pico = db.getPicoByECIFuture(event.eci).wait();
    if(!ctx.pico){
      throw new Error("Invalid eci: " + event.eci);
    }

    ctx.emit("debug", "pico selected");

    var rules = selectRulesToEvalFuture(ctx, salience_graph, rulesets).wait();
    var responses = _.map(rules, function(rule){

      ctx.emit("debug", "rule selected: " + rule.rid + " -> " + rule.name);

      ctx.rid = rule.rid;
      ctx.rule = rule;
      ctx.scope = rule.scope;
      if(_.has(rulesets, rule.rid)){
        ctx.modules_used = rulesets[rule.rid].modules_used;
      }

      return evalRuleInFiber(rule, ctx);
    });

    var res_by_type = _.groupBy(_.flattenDeep(_.values(responses)), "type");

    //TODO other types
    return {
      directives:  _.map(res_by_type.directive, function(d){
        return _.omit(d, "type");
      })
    };
  };

  var signalEvent = function(event, callback){
    applyInFiber(signalEventInFiber, void 0, [event], callback);
  };

  var engine = Future.wrap({
    installRID: installRID,
    signalEvent: signalEvent
  });

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
          rid: rs.rid,
          pico: pico,
          engine: engine,
          modules_used: rs.modules_used,
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
