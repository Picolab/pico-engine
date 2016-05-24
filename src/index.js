var _ = require('lodash');
var λ = require('contra');
var DB = require('./DB');
var evalRule = require('./evalRule');
var queryRulesetFn = require('./queryRulesetFn');
var selectRulesToEval = require('./selectRulesToEval');

var rulesets = {};
var installRuleset = function(rid, path){
  var rs = require('./rulesets/' + path);
  rs.rid = rid;
  _.each(rs.rules, function(rule, rule_name){
    rule.rid = rid;
    rule.rule_name = rule_name;
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
            if(_.has(res_by_type, 'raw')){
              if(_.size(res_by_type) !== 1 || _.size(res_by_type.raw) !== 1){
                return callback(new Error('raw response must be sent alone'));
              }
              callback(undefined, {
                type: 'raw',
                resFn: _.head(res_by_type.raw).resFn
              });
            }else{
              //TODO other types
              callback(undefined, {
                type: 'json',
                data: {
                  directives:  _.map(res_by_type.directive, function(d){
                    return _.omit(d, 'type');
                  })
                }
              });
            }
          });
        });
      });
    },
    callFunction: function(ctx, callback){
      db.getPicoByECI(ctx.eci, function(err, pico){
        if(err) return callback(err);
        if(!pico){
          return callback(new Error('Bad eci'));
        }
        if(!_.has(pico.ruleset, ctx.rid)){
          return callback(new Error('Pico does not have that rid'));
        }

        queryRulesetFn(_.assign({}, ctx, {
          pico: pico,
          db: db
        }), rulesets, callback);
      });
    }
  };
};
