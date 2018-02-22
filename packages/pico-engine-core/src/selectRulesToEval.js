var _ = require("lodash");
var cocb = require("co-callback");
var async = require("async");
var ktypes = require("krl-stdlib/types");
var runKRL = require("./runKRL");
var aggregateEvent = require("./aggregateEvent");

var getAttrString = function(ctx, attr){
    return _.has(ctx, ["event", "attrs", attr])
        ? ktypes.toString(ctx.event.attrs[attr])
        : "";
};

var evalExpr = cocb.wrap(function*(ctx, rule, aggregator, exp){
    var recur = function*(e){
        return yield evalExpr(ctx, rule, aggregator, e);
    };
    if(_.isArray(exp)){
        if(exp[0] === "not"){
            return !(yield recur(exp[1]));
        }else if(exp[0] === "and"){
            return (yield recur(exp[1])) && (yield recur(exp[2]));
        }else if(exp[0] === "or"){
            return (yield recur(exp[1])) || (yield recur(exp[2]));
        }
    }
    //only run the function if the domain and type match
    var domain = ctx.event.domain;
    var type = ctx.event.type;
    if(_.get(rule, ["select", "graph", domain, type, exp]) !== true){
        return false;
    }
    return yield runKRL(rule.select.eventexprs[exp], ctx, aggregator, getAttrString);
});

var getNextState = cocb.wrap(function*(ctx, rule, curr_state, aggregator){
    var stm = rule.select.state_machine[curr_state];

    var i;
    for(i=0; i < stm.length; i++){
        if(yield evalExpr(ctx, rule, aggregator, stm[i][0])){
            //found a match
            return stm[i][1];
        }
    }
    if(curr_state === "end"){
        return "start";
    }
    return curr_state;//by default, stay on the current state
});

var shouldRuleSelect = cocb.wrap(function*(core, ctx, rule){

    var sm_data = yield core.db.getStateMachineYieldable(ctx.pico_id, rule);

    if(_.isFunction(rule.select && rule.select.within)){

        if(!_.isNumber(sm_data.starttime)){
            sm_data.starttime = ctx.event.timestamp.getTime();
        }
        var diff = ctx.event.timestamp.getTime() - sm_data.starttime;
        var time_limit = yield runKRL(rule.select.within, ctx);

        if(diff > time_limit){
            //time has expired, reset the state machine
            sm_data.state = "start";
        }
        if(sm_data.state === "start"){
            // set or reset the clock
            sm_data.starttime = ctx.event.timestamp.getTime();
        }
    }

    var aggregator = aggregateEvent(core, sm_data.state, rule);

    var next_state = yield getNextState(ctx, rule, sm_data.state, aggregator);

    yield core.db.putStateMachineYieldable(ctx.pico_id, rule, {
        state: next_state,
        starttime: sm_data.starttime
    });

    return next_state === "end";
});

var selectForPico = function(core, ctx, pico_rids, callback){

    var rules_to_select = core.rsreg.salientRules(ctx.event.domain, ctx.event.type, function(rid){
        if(pico_rids[rid] !== true){
            return false;
        }
        if(_.has(ctx.event, "for_rid") && _.isString(ctx.event.for_rid)){
            if(rid !== ctx.event.for_rid){
                return false;
            }
        }
        return true;
    });

    async.filter(rules_to_select, function(rule, next){
        var ruleCTX = core.mkCTX({
            rid: rule.rid,
            scope: rule.scope,
            event: ctx.event,
            pico_id: ctx.pico_id,
            rule_name: rule.name,
        });
        cocb.run(shouldRuleSelect(core, ruleCTX, rule), next);
    }, function(err, rules){
        if(err){
            process.nextTick(function(){
                //wrapping in nextTick resolves strange issues with UnhandledPromiseRejectionWarning
                //when infact we are handling the rejection
                callback(err);
            });
            return;
        }
        //rules in the same ruleset must fire in order
        callback(void 0, _.reduce(_.groupBy(rules, "rid"), function(acc, rules){
            return acc.concat(rules);
        }, []));
    });
};

module.exports = function(core, ctx, callback){
    //read this fresh everytime we select, b/c it might have changed during event processing
    core.db.ridsOnPico(ctx.pico_id, function(err, pico_rids){
        if(err) return callback(err);
        selectForPico(core, ctx, pico_rids, callback);
    });
};
