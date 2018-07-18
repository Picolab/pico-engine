var _ = require("lodash");

function toFloat(v){
    return parseFloat(v) || 0;
}

function aggregateWrap(core, current_state_machine_state, rule, ctx, value_pairs, fn){
    return Promise.all(value_pairs.map(function(pair){
        var name = pair[0];
        var value = pair[1] === void 0
            ? null//leveldb doesnt support undefined
            : pair[1];
        function updater(val){
            if(current_state_machine_state === "start"){
                //reset the aggregated values every time the state machine resets
                return [value];
            }else if(current_state_machine_state === "end"){
                //keep a sliding window every time the state machine hits end again i.e. select when repeat ..
                return _.tail(val.concat([value]));
            }
            return val.concat([value]);
        }
        return core.db.updateAggregatorVarYieldable(ctx.pico_id, rule, name, updater)
            .then(function(val){
                ctx.scope.set(name, fn(val));
            });
    }));
}

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
    return function(ctx, aggregator, value_pairs){
        if(!_.has(aggregators, aggregator)){
            throw new Error("Unsupported aggregator: " + aggregator);
        }
        var fn = aggregators[aggregator];
        return aggregateWrap(core, current_state_machine_state, rule, ctx, value_pairs, fn);
    };
};
