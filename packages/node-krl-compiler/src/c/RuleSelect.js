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
      stm[start] = [];

      var loop_backers = [];

      var a = evalEELisp(args[0], "aaa-START", "aaa-END");
      var b = evalEELisp(args[1], "aaa-START", "aaa-END");

      _.each([a, b], function(asdf){
        _.each(asdf["aaa-START"], function(transition){
          var condition = transition[0];
          var next_state = transition[1];
          if(next_state === "aaa-END"){
            stm[start].push([condition, end]);
          }else if(next_state === "aaa-START"){
            loop_backers.push(condition);
          }
        });
      });
      stm[start].push([["and"].concat(loop_backers), start]);
      return stm;
    }
  },
  "and": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(start, end, args, newState){
      var a = args[0];
      var b = args[1];
      var s1 = newState();
      var s2 = newState();

      var stm = {};
      stm[start] = [
        [a, s1],
        [b, s2],
        [["not", ["or", a, b]], start]
      ];
      stm[s1] = [
        [b, end],
        [["not", b], s1]
      ];
      stm[s2] = [
        [a, end],
        [["not", a], s2]
      ];
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
        [lisp, end],
        [["not", lisp], start]
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

  return e("obj", {
    graph: e("json", graph),
    eventexprs: e("obj", eventexprs),
    state_machine: e("json", state_machine)
  });
};
