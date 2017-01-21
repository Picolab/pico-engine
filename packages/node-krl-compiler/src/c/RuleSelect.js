var _ = require("lodash");

var wrapInOr = function(states){
  if(_.size(states) === 1){
    return _.head(states);
  }
  return ["or", _.head(states), wrapInOr(_.tail(states))];
};

var toLispArgs = function(ast, traverse){
  return _.map(ast.args, traverse);
};

var event_ops = {
  "or": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(start, end, args, newState, evalEELisp){
      var stm = {};

      var a = evalEELisp(args[0], start, end);
      var b = evalEELisp(args[1], start, end);

      _.each(_.uniq(_.keys(a).concat(_.keys(b))), function(state){
        if(_.has(a, state)){
          _.each(a[state], function(transition){
            if(!_.has(stm, state)){
              stm[state] = [];
            }
            stm[state].push(transition);
          });
        }else{
          //
        }
        if(_.has(b, state)){
          _.each(b[state], function(transition){
            if(!_.has(stm, state)){
              stm[state] = [];
            }
            stm[state].push(transition);
          });
        }else{
          _.each(b["start"], function(transition){
            if(!_.has(stm, state)){
              stm[state] = [];
            }
            stm[state].push(transition);
          });
        }
      });
      return stm;
    }
  },
  "and": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(start, end, args, newState, evalEELisp){
      var a = evalEELisp(args[0], "aaa-START", "aaa-END");
      var b = evalEELisp(args[1], "bbb-START", "bbb-END");

      var s1 = newState();
      var s2 = newState();

      var stm = {};
      stm[start] = [];
      stm[s1] = [];
      stm[s2] = [];

      _.each(a["aaa-START"], function(transition){
        var condition = transition[0];
        var next_state = transition[1];
        if(next_state === "aaa-END"){
          stm[start].push([condition, s1]);
          stm[s2].push([condition, end]);
        }else if(next_state === "aaa-START"){
          stm[s2].push([condition, s2]);
        }
      });

      _.each(b["bbb-START"], function(transition){
        var condition = transition[0];
        var next_state = transition[1];
        if(next_state === "bbb-END"){
          stm[start].push([condition, s2]);
          stm[s1].push([condition, end]);
        }else if(next_state === "bbb-START"){
          stm[s1].push([condition, s1]);
        }
      });

      return stm;
    }
  }
};

module.exports = function(ast, comp, e){
  if(ast.kind !== "when"){
    throw new Error("RuleSelect.kind not supported: " + ast.kind);
  }
  var ee_id = 0;
  var graph = {};
  var eventexprs = {};

  var onEE = function(ast){
    var domain = ast.event_domain.value;
    var type = ast.event_type.value;
    var id = "expr_" + (ee_id++);

    _.set(graph, [domain, type, id], true);

    eventexprs[id] = comp(ast);
    return id;
  };

  var traverse = function(ast){
    if(ast.type === "EventExpression"){
      return onEE(ast);
    }else if(ast.type === "EventOperator"){
      if(_.has(event_ops, ast.op)){
        return [ast.op].concat(event_ops[ast.op].toLispArgs(ast, traverse));
      }
      throw new Error("EventOperator.op not supported: " + ast.op);
    }
    throw new Error("invalid event ast node: " + ast.type);
  };

  var newState = (function(){
    var i = 0;
    return function(){
      var id = "state_" + i;
      i++;
      return id;
    };
  }());

  var evalEELisp = function(lisp, start, end){
    if(_.isString(lisp)){
      var stm = {};
      stm[start] = [
        [lisp, end]
      ];
      return stm;
    }
    if(_.has(event_ops, lisp[0])){
      return event_ops[lisp[0]].mkStateMachine(start, end, lisp.slice(1), newState, evalEELisp);
    }else{
      throw new Error("EventOperator.op not supported: " + ast.op);
    }
  };

  var lisp = traverse(ast.event);
  var state_machine = evalEELisp(lisp, "start", "end");

  //add all the loop-back conditions
  _.each(state_machine, function(arr, key){
    var away_paths = _.uniq(_.compact(_.map(arr, function(transition){
      var condition = transition[0];
      var next_state = transition[1];
      if(!_.isString(condition) && (next_state === key)){
        return;//ignore this
      }
      return condition;
    })));

    state_machine[key].push([
        [
          "not",
          wrapInOr(away_paths)
        ],
        key
    ]);
  });

  return e("obj", {
    graph: e("json", graph),
    eventexprs: e("obj", eventexprs),
    state_machine: e("json", state_machine)
  });
};
