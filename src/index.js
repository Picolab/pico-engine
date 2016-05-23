var _ = require('lodash');
var λ = require('contra');
var DB = require('./DB');
var evalRule = require('./evalRule');
var queryRulesetFn = require('./queryRulesetFn');
var selectRulesToEval = require('./selectRulesToEval');

var rulesets = {
  'rid1x0': require('./rulesets/hello_world'),
  'rid2x0': require('./rulesets/store_name')
};

module.exports = function(conf){
  var db = DB(conf.db);

  return {
    db: db,
    signalEvent: function(event, callback){
      db.getPicoByECI(event.eci, function(err, pico){
        if(err) return callback(err);

        selectRulesToEval(pico, rulesets, event, function(err, to_eval){
          if(err) return callback(err);

          λ.map(to_eval, function(e, callback){

            var ctx = {
              pico: pico,
              db: db,
              vars: {},
              event: event,
              meta: {
                rule_name: e.rule_name,
                txn_id: 'TODO',//TODO transactions
                rid: e.rid,
                eid: event.eid
              }
            };

            evalRule(e.rule, ctx, callback);
          }, function(err, responses){
            if(err) return callback(err);

            //TODO handle other types
            callback(undefined, {
              type: 'json',
              data: {
                directives: responses
              }
            });
          });
        });
      });
    },
    queryFn: function(eci, rid, fn_name, args, callback){
      db.getPicoByECI(eci, function(err, pico){
        if(err) return callback(err);
        if(!pico){
          return callback(new Error('Bad eci'));
        }
        if(!_.has(pico.ruleset, rid)){
          return callback(new Error('Pico does not have that rid'));
        }

        var ctx = {
          pico: pico,
          db: db,
          rid: rid,
          fn_name: fn_name,
          args: args
        };

        queryRulesetFn(ctx, rulesets, callback);
      });
    }
  };
};
