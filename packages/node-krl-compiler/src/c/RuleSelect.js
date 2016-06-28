var _ = require('lodash');

var event_ops = {
  'or': {
    toLispArgs: function(ast, traverse){
      return _.map(ast.args, traverse);
    },
    mkStateMachine: function(state_machine, args, newState){
      var a = args[0];
      var b = args[1];
      state_machine.start.push([a, 'end']);
      state_machine.start.push([b, 'end']);
      state_machine.start.push([['not', ['or', a, b]], 'start']);
    }
  },
  'and': {
    toLispArgs: function(ast, traverse){
      return _.map(ast.args, traverse);
    },
    mkStateMachine: function(state_machine, args, newState){
      var a = args[0];
      var b = args[1];
      var s1 = newState();
      var s2 = newState();
      state_machine.start.push([a, s1]);
      state_machine.start.push([b, s2]);
      state_machine.start.push([['not', ['or', a, b]], 'start']);

      state_machine[s1].push([b, 'end']);
      state_machine[s1].push([['not', b], s1]);

      state_machine[s2].push([a, 'end']);
      state_machine[s2].push([['not', a], s2]);
    }
  }
};

module.exports = function(ast, comp, e){
  if(ast.kind !== 'when'){
    throw new Error('RuleSelect.kind not supported: ' + ast.kind);
  }
  var ee_id = 0;
  var graph = {};
  var eventexprs = {};

  var onEE = function(ast){
    var domain = ast.event_domain.value;
    var type = ast.event_type.value;
    var id = 'expr_' + (ee_id++);

    _.set(graph, [domain, type, id], true);

    eventexprs[id] = comp(ast);
    return id;
  };

  var traverse = function(ast){
    if(ast.type === 'EventExpression'){
      return onEE(ast);
    }else if(ast.type === 'EventOperator'){
      if(_.has(event_ops, ast.op)){
        return [ast.op].concat(event_ops[ast.op].toLispArgs(ast, traverse));
      }
      throw new Error('EventOperator.op not supported: ' + ast.op);
    }
    throw new Error('invalid event ast node: ' + ast.type);
  };

  var lisp = traverse(ast.event);

  var state_machine = {start: []};

  var newState = (function(){
    var i = 0;
    return function(){
      var id = 'state_' + i;
      i++;
      state_machine[id] = [];
      return id;
    };
  }());

  if(_.isString(lisp)){
    state_machine.start.push([lisp, 'end']);
    state_machine.start.push([['not', lisp], 'start']);
  }else{
    if(_.has(event_ops, lisp[0])){
      event_ops[lisp[0]].mkStateMachine(state_machine, lisp.slice(1), newState);
    }else{
      throw new Error('EventOperator.op not supported: ' + ast.op);
    }
  }

  return e('obj', {
    graph: e('json', graph),
    eventexprs: e('obj', eventexprs),
    state_machine: e('json', state_machine)
  });
};
