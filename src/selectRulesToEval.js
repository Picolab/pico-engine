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
    var curr_state = 'TODO';//TODO get this from memory
    if(!_.has(rule.select.state_machine, curr_state)){
      curr_state = 'start';
    }
    var stm = rule.select.state_machine[curr_state];

    var matching_pair = _.find(stm, function(s){
      var exp = s[0];

      if(_.isArray(exp)){
        return false;//TODO
      }
      return rule.select.eventexprs[exp](ctx);
    });
    var next_state = matching_pair ? matching_pair[1] : undefined;
    if(next_state === 'end'){
      next(undefined, true);
    }else{
      //TODO store the state
      next(undefined, false);
    }
  }, callback);
};
