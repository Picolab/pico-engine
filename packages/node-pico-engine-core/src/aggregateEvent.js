var _ = require("lodash");
var λ = require("contra");
var cocb = require("co-callback");

var toFloat = function(v){
    return parseFloat(v) || 0;
};

var aggregateWrap = function(core, current_state_machine_state, rule, ctx, value_pairs, fn, callback){
    λ.each(value_pairs, function(pair, next){
        var name = pair[0];
        var value = pair[1] === void 0
            ? null//leveldb doesnt support undefined
            : pair[1];
        core.db.updateAggregatorVar(ctx.pico_id, rule, name, function(val){
            if(current_state_machine_state === "start"){
                //reset the aggregated values every time the state machine resets
                return [value];
            }else if(current_state_machine_state === "end"){
                //keep a sliding window every time the state machine hits end again i.e. select when repeat ..
                return _.tail(val.concat([value]));
            }
            return val.concat([value]);
        }, function(err, val){
            if(err) return next(err);
            ctx.scope.set(name, fn(val));
            next();
        });
    }, callback);
};

var aggregators = {
    max: function(values){
        return _.max(_.map(values, toFloat));
    },
    min: function(values){
        return _.min(_.map(values, toFloat));
    },
    sum: function(values){
        return _.reduce(_.map(values, toFloat), function(sum, n){
            return sum + n;
        }, 0);
    },
    avg: function(values){
        var sum = _.reduce(_.map(values, toFloat), function(sum, n){
            return sum + n;
        }, 0);
        return sum / _.size(values);
    },
    push: function(values){
        return values;
    }
};

module.exports = function(core, current_state_machine_state, rule){
    return cocb.toYieldable(function(ctx, aggregator, value_pairs, callback){
        if(_.has(aggregators, aggregator)){
            aggregateWrap(core, current_state_machine_state, rule, ctx, value_pairs, aggregators[aggregator], callback);
            return;
        }
        throw new Error("Unsupported aggregator: " + aggregator);
    });
};
