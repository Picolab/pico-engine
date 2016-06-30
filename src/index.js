var _ = require('lodash');
var λ = require('contra');
var DB = require('./DB');
var Future = require('fibers/future');
var evalRule = require('./evalRule');
var SymbolTable = require('symbol-table');
var applyInFiber = require('./applyInFiber');
var selectRulesToEval = require('./selectRulesToEval');

var rulesets = {};
var salience_graph = {};
var doInstallRuleset = function(path){
  var rs = require('./rulesets/' + path);
  rs.rid = rs.name;
  rs.scope = SymbolTable();
  if(_.isFunction(rs.global)){
    rs.global({
      scope: rs.scope
    });
  }
  _.each(rs.rules, function(rule, rule_name){
    rule.rid = rs.rid;
    rule.rule_name = rule_name;
    rule.scope = rs.scope.push();

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

module.exports = function(conf){
  var db = Future.wrap(DB(conf.db));

  return {
    db: db,
    signalEvent: function(event, callback){
      event.timestamp = new Date();
      db.getPicoByECI(event.eci, function(err, pico){
        if(err) return callback(err);

        var ctx_orig = {
          pico: pico,
          db: db,
          event: event
        };

        selectRulesToEval(ctx_orig, salience_graph, rulesets, function(err, to_eval){
          if(err) return callback(err);

          λ.map(to_eval, function(rule, callback){

            var ctx = _.cloneDeep(ctx_orig);
            ctx.rid = rule.rid;
            ctx.rule = rule;
            ctx.scope = rule.scope;

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
    callFunction: function(query, callback){

      var ctx_orig = {
        eci: query.eci,
        rid: query.rid,
        fn_name: query.fn_name,
        args: query.args
      };

      db.getPicoByECI(ctx_orig.eci, function(err, pico){
        if(err) return callback(err);
        var ctx = _.assign({}, ctx_orig, {
          db: db,
          pico: pico
        });
        if(!ctx.pico){
          return callback(new Error('Bad eci'));
        }
        if(!_.has(ctx.pico.ruleset, ctx.rid)){
          return callback(new Error('Pico does not have that rid'));
        }
        if(!_.has(rulesets, ctx.rid)){
          return callback(new Error('Not found: rid'));
        }
        var rs = rulesets[ctx.rid];
        var shares = _.get(rs, ['meta', 'shares']);
        if(!_.isArray(shares) || !_.includes(shares, ctx.fn_name)){
          return callback(new Error('Not shared'));
        }
        var fun = rs.scope.get(ctx.fn_name);
        if(!_.isFunction(fun)){
          return callback(new Error('Function not shared: ' + ctx.fn_name));
        }
        ctx.scope = rs.scope.push();//they get their own scope where they can't mutate global scope
        applyInFiber(fun, null, [ctx], callback);
      });
    }
  };
};
