var _ = require("lodash");

var wrapInOr = function(states){
  if(_.size(states) === 1){
    return _.head(states);
  }
  return ["or", _.head(states), wrapInOr(_.tail(states))];
};

var permute = function(arr){
  return arr.reduce(function permute(res, item, key, arr){
    return res.concat(arr.length > 1
      ? arr
        .slice(0, key)
        .concat(arr.slice(key + 1))
        .reduce(permute, [])
        .map(function(perm){
          return [item].concat(perm);
        })
      : item
    );
  }, []);
};

var StateMachine = function(){
  var start = _.uniqueId("state_");
  var end = _.uniqueId("state_");
  var transitions = [];
  var join = function(state_1, state_2){
    _.each(transitions, function(t){
      if(t[0] === state_1){
        t[0] = state_2;
      }
      if(t[2] === state_1){
        t[2] = state_2;
      }
    });
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
    join: join,
    optimize: function(){
      var toTarget = function(sub_tree){
        return _.uniqWith(_.compact(_.map(sub_tree, function(o){
          var targets = _.keys(o);
          if(_.size(targets) > 1){
            targets.sort();
            return targets;
          }
        })), _.isEqual);
      };

      var tree, to_merge;
      // eslint-disable-next-line no-constant-condition
      while(true){
        tree = {};
        _.each(transitions, function(t){
          _.set(tree, [JSON.stringify(t[1]), "from_to", t[0], t[2]], true);
          _.set(tree, [JSON.stringify(t[1]), "to_from", t[2], t[0]], true);
        });
        to_merge = _.flatten(_.map(tree, function(sub_tree){
          return _.uniqWith(toTarget(sub_tree["from_to"])
              .concat(toTarget(sub_tree["to_from"])),
              _.isEqual
          );
        }));
        if(_.isEmpty(to_merge)){
          break;
        }
        _.each(to_merge, function(states){
          var to_state = _.head(states);
          _.each(_.tail(states), function(from_state){
            join(from_state, to_state);
          });
        });
      }
      transitions = [];
      _.each(tree, function(sub_tree, on_event){
        _.each(sub_tree["from_to"], function(asdf, from_state){
          _.each(asdf, function(bool, to_state){
            transitions.push([from_state, JSON.parse(on_event), to_state]);
          });
        });
      });
    },
    optimize2: function(){
      var toTarget = function(sub_tree){
        return _.uniqWith(_.compact(_.map(sub_tree, function(o){
          var targets = _.keys(o);
          if(_.size(targets) > 1){
            targets.sort();
            return targets;
          }
        })), _.isEqual);
      };

      var tree, to_merge;
      // eslint-disable-next-line no-constant-condition
      while(true){
        tree = {};
        _.each(transitions, function(t){
          _.set(tree, [JSON.stringify(t[1]), "from_to", t[0], t[2]], true);
          //_.set(tree, [JSON.stringify(t[1]), "to_from", t[2], t[0]], true);
        });
        to_merge = _.flatten(_.map(tree, function(sub_tree){
          return _.uniqWith(toTarget(sub_tree["from_to"])
              .concat(toTarget(sub_tree["to_from"])),
              _.isEqual
          );
        }));
        if(_.isEmpty(to_merge)){
          break;
        }
        _.each(to_merge, function(states){
          var to_state = _.head(states);
          _.each(_.tail(states), function(from_state){
            join(from_state, to_state);
          });
        });
      }
      transitions = [];
      _.each(tree, function(sub_tree, on_event){
        _.each(sub_tree["from_to"], function(asdf, from_state){
          _.each(asdf, function(bool, to_state){
            transitions.push([from_state, JSON.parse(on_event), to_state]);
          });
        });
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

      var prev;
      _.each(args, function(arg, j){
        var a = evalEELisp(arg);
        s.concat(a);
        if(j === 0){
          s.join(a.start, s.start);
        }
        if(j === _.size(args) - 1){
          s.join(a.end, s.end);
        }
        if(prev){
          s.join(prev.end, a.start);
        }
        prev = a;
      });

      return s;
    }
  },
  "after": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var prev;
      _.each(_.range(_.size(args) - 1, -1), function(i, j){
        var a = evalEELisp(args[i]);
        s.concat(a);
        if(j === 0){
          s.join(a.start, s.start);
        }
        if(j === _.size(args) - 1){
          s.join(a.end, s.end);
        }
        if(prev){
          s.join(prev.end, a.start);
        }
        prev = a;
      });

      return s;
    }
  },
  "then": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var merge_points = [];
      var prev;
      _.each(args, function(arg, j){
        var a = evalEELisp(arg);
        s.concat(a);
        if(j === 0){
          s.join(a.start, s.start);
        }
        if(j === _.size(args) - 1){
          s.join(a.end, s.end);
        }
        if(prev){
          s.join(prev.end, a.start);
          merge_points.push(a.start);
        }
        prev = a;
      });

      var transitions = s.getTransitions();
      _.each(merge_points, function(da_state){
        //if not da_state return to start
        var not_b = wrapInOr(_.uniq(_.compact(_.map(transitions, function(t){
          if(t[0] === da_state){
            return ["not", t[1]];
          }
        }))));
        s.add(da_state, not_b, s.start);
      });

      return s;
    }
  },
  "and": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      _.each(permute(_.range(0, _.size(args))), function(indices){
        var prev;
        _.each(indices, function(i, j){
          var a = evalEELisp(args[i]);
          s.concat(a);
          if(j === 0){
            s.join(a.start, s.start);
          }
          if(j === _.size(indices) - 1){
            s.join(a.end, s.end);
          }
          if(prev){
            s.join(prev.end, a.start);
          }
          prev = a;
        });
      });
      s.optimize();

      return s;
    }
  },
  "or": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      _.each(args, function(arg){
        var a = evalEELisp(arg);
        s.concat(a);
        s.join(a.start, s.start);
        s.join(a.end, s.end);
      });

      return s;
    }
  },
  "between": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var a = evalEELisp(args[0]);
      var b = evalEELisp(args[1]);
      var c = evalEELisp(args[2]);

      s.concat(a);
      s.concat(b);
      s.concat(c);

      s.join(b.start, s.start);
      s.join(b.end, a.start);
      s.join(a.end, c.start);
      s.join(c.end, s.end);

      return s;
    }
  },
  "not between": {
    toLispArgs: toLispArgs,
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var a = evalEELisp(args[0]);
      var b = evalEELisp(args[1]);
      var c = evalEELisp(args[2]);

      s.concat(a);
      s.concat(b);
      s.concat(c);

      //start:b -> c -> end
      s.join(b.start, s.start);
      s.join(b.end, c.start);
      s.join(c.end, s.end);

      //a -> start
      s.join(a.start, c.start);
      s.join(a.end, s.start);

      return s;
    }
  },
  "any": {
    toLispArgs: function(ast, traverse){
      var num = _.head(ast.args);
      return [num.value].concat(_.map(_.tail(ast.args), traverse));
    },
    mkStateMachine: function(args, evalEELisp){
      var s = StateMachine();

      var num = _.head(args);
      var eventexs = _.tail(args);

      var indices_groups = _.uniqWith(_.map(permute(_.range(0, _.size(eventexs))), function(indices){
        return _.take(indices, num);
      }), _.isEqual);

      _.each(indices_groups, function(indices){
        indices = _.take(indices, num);
        var prev;
        _.each(indices, function(i, j){
          var a = evalEELisp(eventexs[i]);
          s.concat(a);
          if(j === 0){
            s.join(a.start, s.start);
          }
          if(j === _.size(indices) - 1){
            s.join(a.end, s.end);
          }
          if(prev){
            s.join(prev.end, a.start);
          }
          prev = a;
        });
      });

      /*
      var tree = {};
      _.each(s.getTransitions(), function(t){
        _.set(tree, [JSON.stringify(t[1]), "from_to", t[0], t[2]], true);
        _.set(tree, [JSON.stringify(t[1]), "to_from", t[2], t[0]], true);
      });
      console.log(JSON.stringify(tree, false, 2));
      process.exit();
      */
      s.optimize2();

      return s;
    }
  },
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
    var s;
    if(_.isString(lisp)){
      s = StateMachine();
      s.add(s.start, lisp, s.end);
      return s;
    }
    if(_.has(event_ops, lisp[0])){
      s = event_ops[lisp[0]].mkStateMachine(lisp.slice(1), evalEELisp);
      //s.optimize();
      return s;
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
