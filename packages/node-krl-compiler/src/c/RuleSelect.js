var _ = require('lodash');

module.exports = function(ast, comp, e){
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
      if(ast.op === 'or'){
        return _.map(ast.args, traverse);
      }
      throw new Error('EventOperator.op not supported: ' + ast.op);
    }
    throw new Error('invalid event ast node: ' + ast.type);
  };

  traverse(ast.event);

  var state_machine = {start: []};
  _.each(eventexprs, function(estree, id){
    state_machine.start.push([id, 'end']);
    state_machine.start.push([['not', id], 'start']);
  });

  return e('obj', {
    graph: e('json', graph),
    eventexprs: e('obj', eventexprs),
    state_machine: e('json', state_machine)
  });
};
