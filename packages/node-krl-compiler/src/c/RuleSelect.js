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
    compile: function(){
      // we want to ensure we get the same output on every compile
      // that is why we are re-naming states and sorting the output
      var out_states = {};
      out_states[start] = "start";
      out_states[end] = "end";
      var i = 0;
      var toOutState = function(state){
        if(_.has(out_states, state)){
          return out_states[state];
        }
        return out_states[state] = "s" + (i++);
      };
      var out_transitions = _.sortBy(_.map(transitions, function(t){
        return [toOutState(t[0]), t[1], toOutState(t[2])];
      }), function(t){
        var score = 0;
        if(t[0] === "start"){
          score -= 1000;
        }
        if(/^s[0-9]+$/.test(t[0])){
          score += _.parseInt(t[0].substring(1), 10) || 0;
        }
        return score;
      });
      var stm = {};
      _.each(out_transitions, function(t){
        if(!_.has(stm, t[0])){
          stm[t[0]] = [];
        }
        stm[t[0]].push([t[1], t[2]]);
      });
      return stm;
    }
  };
};

var toLispArgs = function(ast, traverse){
  return _.map(ast.args, traverse);
};

var event_ops = {
  "before": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var a = evalEELisp(args[0]);
      var b = evalEELisp(args[1]);

      s.concat(a);
      s.concat(b);

      s.join(a.start, s.start);
      s.join(a.end, b.start);
      s.join(b.end, s.end);

      return s;
    }
  },
  "after": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var a = evalEELisp(args[0]);
      var b = evalEELisp(args[1]);

      s.concat(a);
      s.concat(b);

      s.join(b.start, s.start);
      s.join(b.end, a.start);
      s.join(a.end, s.end);

      return s;
    }
  },
  "then": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var a = evalEELisp(args[0]);
      var b = evalEELisp(args[1]);

      s.concat(a);
      s.concat(b);

      s.join(a.start, s.start);
      s.join(a.end, b.start);
      s.join(b.end, s.end);

      //if not B return to start
      var not_b = wrapInOr(_.uniq(_.compact(_.map(s.getTransitions(), function(t){
        if(t[0] === b.start){
          return ["not", t[1]];
        }
      }))));
      s.add(b.start, not_b, s.start);

      return s;
    }
  },
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
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var a0 = evalEELisp(args[0]);
      var b0 = evalEELisp(args[1]);
      var a1 = evalEELisp(args[0]);
      var b1 = evalEELisp(args[1]);

      s.concat(a0);
      s.concat(b0);
      s.concat(a1);
      s.concat(b1);

      s.join(a0.start, s.start);
      s.join(b0.start, s.start);

      s.join(a0.end, b1.start);
      s.join(b0.end, a1.start);

      s.join(a1.end, s.end);
      s.join(b1.end, s.end);

      return s;
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
    state_machine: e("json", state_machine.compile())
  });
};
