var _ = require('lodash');
var λ = require('contra');
var DB = require('./DB');
var Future = require('fibers/future');
var evalRule = require('./evalRule');
var KRLString = require('./krl/KRLString');
var SymbolTable = require('symbol-table');
var applyInFiber = require('./applyInFiber');
var selectRulesToEval = require('./selectRulesToEval');

var getArg = function(args, name, index){
  return _.has(args, name)
    ? args[name]
    : args[index];
};
var mk_krlClosure = function(ctx, fn){
  return function(ctx2, args){
    return fn(_.assign({}, ctx2, {
      scope: ctx.scope.push(),
      args: args
    }));
  };
};
var mk_baseType = function(value){
  if(_.isString(value)){
    return KRLString(value);
  }
  return value;
};
var mkCTX = function(ctx){
  ctx.getArg = getArg;
  ctx.mk_krlClosure = mk_krlClosure;
  ctx.mk_baseType = mk_baseType;
  return ctx;
};

var rulesets = {};
var salience_graph = {};
var doInstallRuleset = function(path){
  var rs = require('./rulesets/' + path);
  rs.rid = rs.name;
  rs.scope = SymbolTable();
  if(_.isFunction(rs.global)){
    rs.global(mkCTX({
      scope: rs.scope
    }));
  }
  _.each(rs.rules, function(rule, rule_name){
    rule.rid = rs.rid;
    rule.rule_name = rule_name;

    _.each(rule.select && rule.select.graph, function(g, domain){
      _.each(g, function(exprs, type){
        _.set(salience_graph, [domain, type, rule.rid, rule.rule_name], true);
      });
    });
  });
  rulesets[rs.rid] = rs;
};

var installRuleset = function(path){
  applyInFiber(doInstallRuleset, null, [path], function(err){
    //TODO better error handling when rulesets fail to load
    if(err) throw err;
  });
};

installRuleset('hello-world');
installRuleset('events');
installRuleset('persistent');
installRuleset('scope');
installRuleset('methods');

module.exports = function(conf){
  var db = Future.wrap(DB(conf.db));

  return {
    db: db,
    signalEvent: function(event, callback){
      event.timestamp = new Date();
      db.getPicoByECI(event.eci, function(err, pico){
        if(err) return callback(err);

        var ctx_orig = mkCTX({
          pico: pico,
          db: db,
          event: event
        });

        selectRulesToEval(ctx_orig, salience_graph, rulesets, function(err, to_eval){
          if(err) return callback(err);

          λ.map(to_eval, function(rule, callback){

            var ctx = _.assign({}, ctx_orig, {
              rid: rule.rid,
              rule: rule,
              scope: rule.scope
            });

            evalRule(rule, ctx, callback);
          }, function(err, responses){
            if(err) return callback(err);

            var res_by_type = _.groupBy(_.flattenDeep(responses), 'type');

            //TODO other types
            callback(undefined, {
              directives:  _.map(res_by_type.directive, function(d){
                return _.omit(d, 'type');
              })
            });
          });
        });
      });
    },
    runQuery: function(query, callback){
      db.getPicoByECI(query.eci, function(err, pico){
        if(err) return callback(err);
        if(!pico){
          return callback(new Error('Bad eci'));
        }
        if(!_.has(pico.ruleset, query.rid)){
          return callback(new Error('Pico does not have that rid'));
        }
        if(!_.has(rulesets, query.rid)){
          return callback(new Error('Not found: rid'));
        }
        var rs = rulesets[query.rid];
        var shares = _.get(rs, ['meta', 'shares']);
        if(!_.isArray(shares) || !_.includes(shares, query.name)){
          return callback(new Error('Not shared'));
        }
        if(!rs.scope.has(query.name)){
          //TODO throw -or- nil????
          return callback(new Error('Shared, but not defined: ' + query.name));
        }

        ////////////////////////////////////////////////////////////////////////
        var ctx = mkCTX({
          db: db,
          rid: rs.rid,
          pico: pico,
          scope: rs.scope
        });
        var val = ctx.scope.get(query.name);
        if(_.isFunction(val)){
          applyInFiber(val, null, [ctx, query.args], callback);
        }else{
          callback(undefined, val);
        }
      });
    }
  };
};
