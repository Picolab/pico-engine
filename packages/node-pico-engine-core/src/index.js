var _ = require("lodash");
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

var mkCTX = function(ctx){
  ctx.getArg = getArg;
  ctx.KRLClosure = KRLClosure;
  if(!_.has(ctx, "emit")){
    ctx.emit = _.noop;//stdlib expects an "emit" function to be available
  }
  ctx.callKRLstdlib = function(fn_name){
    var args = _.toArray(arguments);
    args[0] = ctx;
    return krl_stdlib[fn_name].apply(void 0, args);
  };
  return ctx;
};

var rulesets = {};
var salience_graph = {};

var doInstallRuleset = function(rs){
  rs.scope = SymbolTable();
  if(_.isFunction(rs.meta && rs.meta.configure)){
    rs.meta.configure(mkCTX({
      scope: rs.scope
    }));
  }
  if(_.isFunction(rs.global)){
    rs.global(mkCTX({
      scope: rs.scope
    }));
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
  applyInFiber(doInstallRuleset, null, [rs], callback);
};

module.exports = function(conf){
  var db = Future.wrap(DB(conf.db));
  var compileAndLoadRuleset = conf.compileAndLoadRuleset;

  var emitter = new EventEmitter();

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

  var signalEventInFiber = function(event){
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

    var pico = db.getPicoByECIFuture(event.eci).wait();
    if(!pico){
      throw new Error("Invalid eci: " + event.eci);
    }
    debug_info.pico_id = pico.id;
    emitter.emit("debug", "event", debug_info, "pico selected");

    var ctx_orig = mkCTX({
      pico: pico,
      db: db,
      engine: engine,
      modules: modules,
      event: event
    });

    var rules = selectRulesToEvalFuture(ctx_orig, salience_graph, rulesets).wait();
    var responses = _.map(rules, function(rule){
      var rule_debug_info = _.assign({}, debug_info, {
        rid: rule.rid,
        rule_name: rule.name
      });

      var ctx = _.assign({}, ctx_orig, {
        rid: rule.rid,
        rule: rule,
        scope: rule.scope,
        emitDebug: function(msg){
          emitter.emit("debug", "event", rule_debug_info, msg);
        }
      });
      if(_.has(rulesets, rule.rid)){
        ctx.modules_used = rulesets[rule.rid].modules_used;
      }

      ctx.emitDebug("rule selected");

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
          db: db,
          rid: rs.rid,
          pico: pico,
          engine: engine,
          modules: modules,
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
