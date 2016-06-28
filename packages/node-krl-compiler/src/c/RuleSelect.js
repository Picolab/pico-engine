var _ = require('lodash');

var event_op_passthru_args = {
  'or': true,
  'and': true
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
      if(_.has(event_op_passthru_args, ast.op)){
        return [ast.op].concat(_.map(ast.args, traverse));
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
    if(lisp[0] === 'or'){
      state_machine.start.push([lisp[1], 'end']);
      state_machine.start.push([lisp[2], 'end']);
      state_machine.start.push([['not', lisp], 'start']);
    }else if(lisp[0] === 'and'){
      var s1 = newState();
      var s2 = newState();
      state_machine.start.push([lisp[1], s1]);
      state_machine.start.push([lisp[2], s2]);
      state_machine.start.push([['not', ['or', lisp[1], lisp[2]]], 'start']);

      state_machine[s1].push([lisp[2], 'end']);
      state_machine[s1].push([['not', lisp[2]], s1]);

      state_machine[s2].push([lisp[1], 'end']);
      state_machine[s2].push([['not', lisp[1]], s2]);
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
