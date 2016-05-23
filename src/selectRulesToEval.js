var _ = require('lodash');
var λ = require('contra');

module.exports = function(pico, rulesets, event, callback){
  //TODO optimize using the salience graph

  var all_rules = _.flatten(_.map(rulesets, function(rs){
    return _.values(rs.rules);
  }));

  var ctx = {event: event};

  λ.filter(all_rules, function(rule, next){
    if(!_.has(pico && pico.ruleset, rule.rid)){
      next(undefined, false);
      return;
    }
    rule.select(ctx, next);
  }, callback);
};
