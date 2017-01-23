var _ = require("lodash");

var wrapInOr = function(states){
  if(_.size(states) === 1){
    return _.head(states);
  }
  return ["or", _.head(states), wrapInOr(_.tail(states))];
};

var uid = _.uniqueId;

var StateMachine = function(){
  var start = uid();
  var end = uid();
  var transitions = [];
  var normalizeStartEnd = function(state){
    if(state === start){
      return "start";
    }else if(state === end){
      return "end";
    }
    return state;
  };
  return {
    start: start,
    end: end,
    add: function(from_state, on_event, to_state){
      transitions.push([from_state, on_event, to_state]);
    },
    getTransitions: function(){
      return transitions;
    },
    concat: function(other){
      _.each(other.getTransitions(), function(t){
        transitions.push(_.cloneDeep(t));
      });
    },
    join: function(state_1, state_2){
      _.each(transitions, function(t){
        if(t[0] === state_1){
          t[0] = state_2;
        }
        if(t[2] === state_1){
          t[2] = state_2;
        }
      });
    },
    toJSON: function(){
      var stm = {};
      _.each(transitions, function(t){
        var from_state = normalizeStartEnd(t[0]);
        var on_event = t[1];
        var to_state = normalizeStartEnd(t[2]);
        if(!_.has(stm, from_state)){
          stm[from_state] = [];
        }
        stm[from_state].push([on_event, to_state]);
      });
      return stm;
    },
    clone: function(){
    }
  };
};

var toLispArgs = function(ast, traverse){
  return _.map(ast.args, traverse);
};

var event_ops = {
  "or": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var a = evalEELisp(args[0]);
      var b = evalEELisp(args[1]);

      s.concat(a);
      s.concat(b);

      s.join(a.start, s.start);
      s.join(b.start, s.start);

      s.join(a.end, s.end);
      s.join(b.end, s.end);

      return s;
    }
  },
  "and": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(start, end, args, newState, evalEELisp){
      var a = evalEELisp(args[0], start, end);
      var b = evalEELisp(args[1], start, end);

      var s1 = newState();
      var s2 = newState();

      var stm = {};
      var stmPush = function(state, transition){
        if(!_.has(stm, state)){
          stm[state] = [];
        }
        stm[state].push(transition);
      };

      stm[start] = [];
      stm[s1] = [];
      stm[s2] = [];

      _.each(a[start], function(transition){
        var condition = transition[0];
        var next_state = transition[1];
        if(next_state === end){
          stmPush(start, [condition, s1]);
          stmPush(s2, [condition, end]);
        }
      });

      _.each(b[start], function(transition){
        var condition = transition[0];
        var next_state = transition[1];
        if(next_state === end){
          stmPush(start, [condition, s2]);
          stmPush(s1, [condition, end]);
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

  var evalEELisp = function(lisp){
    if(_.isString(lisp)){
      var s = StateMachine();
      s.add(s.start, lisp, s.end);
      return s;
    }
    if(_.has(event_ops, lisp[0])){
      return event_ops[lisp[0]].mkStateMachine(lisp.slice(1), evalEELisp);
    }else{
      throw new Error("EventOperator.op not supported: " + ast.op);
    }
  };

  var lisp = traverse(ast.event);
  var state_machine = evalEELisp(lisp);

  return e("obj", {
    graph: e("json", graph),
    eventexprs: e("obj", eventexprs),
    state_machine: e("json", state_machine.toJSON())
  });
};
