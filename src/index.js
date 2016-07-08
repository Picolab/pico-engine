var _ = require('lodash');
var λ = require('contra');
var DB = require('./DB');
var krl = require('./krl');
var Future = require('fibers/future');
var evalRule = require('./evalRule');
var SymbolTable = require('symbol-table');
var applyInFiber = require('./applyInFiber');
var selectRulesToEval = require('./selectRulesToEval');

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
var doInstallRuleset = function(path){
  var rs = require('../test-rulesets/' + path);
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
installRuleset('operators');
installRuleset('chevron');

module.exports = function(conf){
  var db = Future.wrap(DB(conf.db));

  var mkPersistent = function(pico_id, rid){
    return {
      getEnt: function(key){
        return krl.fromJS(db.getEntVarFuture(pico_id, key).wait());
      },
      putEnt: function(key, value){
        db.putEntVarFuture(pico_id, key, krl.toJS(value)).wait();
      },
      getApp: function(key, value){
        return krl.fromJS(db.getAppVarFuture(rid, key).wait());
      },
      putApp: function(key, value){
        db.putAppVarFuture(rid, key, krl.toJS(value)).wait();
      }
    };
  };

  return {
    db: db,
    signalEvent: function(event, callback){
      event.timestamp = new Date();
      event.getAttrMatches = function(pairs){
        var matches = [];
        var i, attr, m, pair;
        for(i = 0; i < pairs.length; i++){
          pair = pairs[i];
          attr = event.attrs[pair[0]];
          m = pair[1].as('javascript').exec(attr || '');
          if(!m){
            return undefined;
          }
          matches.push(m[1]);
        }
        return matches;
      };
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
              persistent: mkPersistent(pico.id, rule.rid),
              scope: rule.scope
            });

            evalRule(rule, ctx, callback);
          }, function(err, responses){
            if(err) return callback(err);

            var res_by_type = _.groupBy(_.flattenDeep(responses), 'type');

            //TODO other types
            callback(undefined, krl.toJS({
              directives:  _.map(res_by_type.directive, function(d){
                return _.omit(d, 'type');
              })
            }));
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
          persistent: mkPersistent(pico.id, rs.rid),
          scope: rs.scope
        });
        var val = ctx.scope.get(query.name);
        if(_.isFunction(val)){
          applyInFiber(val, null, [ctx, query.args], function(err, resp){
            if(err) return callback(err);
            callback(undefined, krl.toJS(resp));
          });
        }else{
          callback(undefined, krl.toJS(val));
        }
      });
    }
  };
};
