var _ = require('lodash');
var λ = require('contra');

module.exports = function(ctx, rulesets, callback){
  //TODO optimize by using the salience graph

  var all_rules = _.flatten(_.map(rulesets, function(rs){
    return _.values(rs.rules);
  }));

  λ.filter(all_rules, function(rule, next){
    if(!_.has(ctx.pico && ctx.pico.ruleset, rule.rid)){
      next(undefined, false);
      return;
    }
    rule.select(ctx, next);
  }, callback);
};
