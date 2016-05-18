var _ = require('lodash');
var λ = require('contra');
var DB = require('./DB');
var cuid = require('cuid');
var evalRule = require('./evalRule');
var queryRulesetFn = require('./queryRulesetFn');
var selectRulesToEval = require('./selectRulesToEval');

var rulesets = {
  'rid1x0': require('./rulesets/hello_world'),
  'rid2x0': require('./rulesets/store_name')
};

module.exports = function(conf){
  var db = DB({
    path: conf.db_path
  });

  return {
    db: db,
    newPico: function(opts, callback){
      var new_pico = {
        id: cuid()
      };
      db.put(['pico', new_pico.id], new_pico, function(err){
        if(err) return callback(err);
        callback(undefined, new_pico);
      });
    },
    newChannel: function(opts, callback){
      var new_channel = {
        id: cuid(),
        name: opts.name,
        type: opts.type
      };
      var key = ['pico', opts.pico_id, 'channel', new_channel.id];
      db.put(key, new_channel, function(err){
        if(err) return callback(err);
        callback(undefined, new_channel);
      });
    },
    addRuleset: function(opts, callback){
      db.put(['pico', opts.pico_id, 'ruleset', opts.rid], {on: true}, callback);
    },
    removeRuleset: function(pico_id, rid, callback){
      db.del(['pico', pico_id, 'ruleset', rid], callback);
    },
    removeChannel: function(pico_id, eci, callback){
      db.del(['pico', pico_id, 'channel', eci], callback);
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
    },
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
          }, callback);
        });
      });
    },
    dbToObj: db.dbToObj
  };
};
