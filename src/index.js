var _ = require('lodash');
var λ = require('contra');
var DB = require('./DB');
var evalRule = require('./evalRule');
var selectRulesToEval = require('./selectRulesToEval');

var rulesets = {};
var salience_graph = {};
var installRuleset = function(rid, path){
  var rs = require('./rulesets/' + path);
  rs.rid = rid;
  _.each(rs.rules, function(rule, rule_name){
    rule.rid = rid;
    rule.rule_name = rule_name;

    _.each(rule.select && rule.select.graph, function(g, domain){
      _.each(g, function(exprs, type){
        _.set(salience_graph, [domain, type, rule.rid, rule.rule_name], true);
      });
    });
  });
  rulesets[rid] = rs;
};

installRuleset('rid1x0', 'hello_world');
installRuleset('rid2x0', 'store_name');
installRuleset('rid3x0', 'raw');
installRuleset('rid4x0', 'event_ops');

module.exports = function(conf){
  var db = DB(conf.db);

  return {
    db: db,
    signalEvent: function(event, callback){
      event.timestamp = new Date();
      db.getPicoByECI(event.eci, function(err, pico){
        if(err) return callback(err);

        var ctx_orig = {
          pico: pico,
          db: db,
          vars: {},
          event: event
        };

        selectRulesToEval(ctx_orig, rulesets, function(err, to_eval){
          if(err) return callback(err);

          λ.map(to_eval, function(rule, callback){

            var ctx = _.cloneDeep(ctx_orig);
            ctx.rule = rule;

            evalRule(rule, ctx, callback);
          }, function(err, responses){
            if(err) return callback(err);

            var res_by_type = _.groupBy(responses, 'type');

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
    callFunction: function(ctx_orig, callback){
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
        if(!_.has(rulesets[ctx.rid].provided_functions, ctx.fn_name)){
          return callback(new Error('Not found: function'));
        }
        var fun = rulesets[ctx.rid].provided_functions[ctx.fn_name];

        if(fun.type === 'query'){
          fun.fn(ctx, callback);
        }else if(fun.type === 'raw'){
          callback(undefined, function(res){
            fun.fn(ctx, res);
          });
        }else{
          callback(new Error('invalid provided_function type: ' + fun.type));
        }
      });
    }
  };
};
