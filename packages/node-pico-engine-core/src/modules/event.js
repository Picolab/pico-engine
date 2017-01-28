var _ = require("lodash");
var getArg = require("../getArg");

var toFloat = function(v){
  v = parseFloat(v);
  if(_.isNaN(v)){
    v = void 0;
  }
  return v;
};

var aggregateWrap = function(ctx, value_pairs, fn){
  _.each(value_pairs, function(pair){
    var name = pair[0];
    var value = pair[1];
    var val = ctx.db.updateAggregatorVarFuture(ctx.pico_id, ctx.rule, name, function(val){
      if(ctx.current_state_machine_state === "start"){
        //reset the aggregated values every time the state machine resets
        return [value];
      }else if(ctx.current_state_machine_state === "end"){
        //keep a sliding window every time the state machine hits end again i.e. select when repeat ..
        return _.tail(val.concat([value]));
      }
      return val.concat([value]);
    }).wait();
    ctx.scope.set(name, fn(val));
  });
};

var aggregators = {
  max: function(values){
    return _.max(_.map(values, toFloat));
  },
  min: function(values){
    return _.min(_.map(values, toFloat));
  }
};

var fns = {
  attrs: function(ctx, args){
    return _.cloneDeep(ctx.event.attrs);//the user may mutate their copy
  },
  attr: function(ctx, args){
    var name = getArg(args, "name", 0);
    return ctx.event.attrs[name];
  },
  attrMatches: function(ctx, args){
    var pairs = getArg(args, "pairs", 0);
    var matches = [];
    var i, attr, m, pair;
    for(i = 0; i < pairs.length; i++){
      pair = pairs[i];
      attr = ctx.event.attrs[pair[0]];
      m = pair[1].exec(attr || "");
      if(!m){
        return undefined;
      }
      matches.push(m[1]);
    }
    return matches;
  },

  raise: function(ctx, args){
    var revent = getArg(args, "revent", 0);
    ctx.raiseEvent(revent);
  },

  //TODO this is technically a RuleAction
  //TODO should this rather return info for event to be signaled?
  //TODO is this allowed other places in the code?
  send: function(ctx, args){
    var event = getArg(args, "event", 0);
    return {
      type: "event:send",
      event: event
    };
  },
  aggregateEvent: function(ctx, args){
    var aggregator = getArg(args, "aggregator", 0);
    var value_pairs = getArg(args, "value_pairs", 1);
    if(_.has(aggregators, aggregator)){
      aggregateWrap(ctx, value_pairs, aggregators[aggregator]);
      return;
    }
    throw new Error("Unsupported aggregator: " + aggregator);
  }
};

module.exports = {
  get: function(ctx, id){
    return fns[id];
  }
};
