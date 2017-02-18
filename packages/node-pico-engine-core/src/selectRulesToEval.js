var _ = require("lodash");
var λ = require("contra");
var cocb = require("co-callback");
var runKRL = require("./runKRL");

var evalExpr = cocb.wrap(function*(ctx, exp){
    if(_.isArray(exp)){
        if(exp[0] === "not"){
            return !(yield evalExpr(ctx, exp[1]));
        }else if(exp[0] === "and"){
            return (yield evalExpr(ctx, exp[1])) && (yield evalExpr(ctx, exp[2]));
        }else if(exp[0] === "or"){
            return (yield evalExpr(ctx, exp[1])) || (yield evalExpr(ctx, exp[2]));
        }
    }
    //only run the function if the domain and type match
    var domain = ctx.event.domain;
    var type = ctx.event.type;
    if(_.get(ctx, ["rule", "select", "graph", domain, type, exp]) !== true){
        return false;
    }
    return yield runKRL(ctx.rule.select.eventexprs[exp], ctx);
});

var getNextState = cocb.wrap(function*(ctx, curr_state){
    var stm = ctx.rule.select.state_machine[curr_state];

    var i;
    for(i=0; i < stm.length; i++){
        if(yield evalExpr(ctx, stm[i][0])){
            //found a match
            return stm[i][1];
        }
    }
    if(curr_state === "end"){
        return "start";
    }
    return curr_state;//by default, stay on the current state
});

var shouldRuleSelect = cocb.wrap(function*(ctx, rule){

    var curr_state = yield ctx.db.getStateMachineStateYieldable(ctx.pico_id, rule);

    if(_.isFunction(rule.select && rule.select.within)){

        var last_restart = yield ctx.db.getStateMachineStartTimeYieldable(ctx.pico_id, rule);
        if(!_.isNumber(last_restart)){
            last_restart = ctx.event.timestamp.getTime();
        }
        var diff = ctx.event.timestamp.getTime() - last_restart;
        var time_limit = yield runKRL(rule.select.within, ctx);

        if(diff > time_limit){
            //time has expired, reset the state machine
            curr_state = "start";
        }

        if(curr_state === "start"){
            yield ctx.db.putStateMachineStartTimeYieldable(ctx.pico_id, rule, ctx.event.timestamp.getTime());
        }
    }

    //this ctx will be passed to the compiled code for evaluting event exp
    var ctx_for_eventexp = _.assign({}, ctx, {
        rule: rule,
        scope: rule.scope,
        current_state_machine_state: curr_state
    });
    var next_state = yield getNextState(ctx_for_eventexp, curr_state);

    yield ctx.db.putStateMachineStateYieldable(ctx.pico_id, rule, next_state);

    return next_state === "end";
});

var selectForPico = function(ctx, pico, callback){

    var to_run = _.get(ctx.salience_graph, [ctx.event.domain, ctx.event.type], {});

    var rules_to_select = [];
    _.each(to_run, function(rules, rid){
        if(!_.has(pico.ruleset, rid)){
            return;
        }
        if(_.has(ctx.event, "for_rid") && _.isString(ctx.event.for_rid)){
            if(rid !== ctx.event.for_rid){
                return;
            }
        }
        _.each(rules, function(is_on, rule_name){
            if(is_on){
                var rule = _.get(ctx.rulesets, [rid, "rules", rule_name]);
                if(rule){
                    //shallow clone with it"s own scope for this run
                    rules_to_select.push(_.assign({}, rule, {
                        scope: ctx.rulesets[rid].scope.push()
                    }));
                }
            }
        });
    });

    λ.filter(rules_to_select, function(rule, next){
        cocb.run(shouldRuleSelect(ctx, rule), next);
    }, function(err, rules){
        if(err) return callback(err);
        //rules in the same ruleset must fire in order
        callback(void 0, _.reduce(_.groupBy(rules, "rid"), function(acc, rules){
            return acc.concat(rules);
        }, []));
    });
};

module.exports = function(ctx, callback){
    //read this fresh everytime we select, b/c it might have changed during event processing
    ctx.db.getPico(ctx.pico_id, function(err, pico){
        if(err) return callback(err);
        selectForPico(ctx, pico, callback);
    });
};
