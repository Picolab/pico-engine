var _ = require('lodash');

module.exports = function(ast, comp, e){
  ast = ast.event;//TODO remove this Hack

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

  //TODO taverse and get all event expressions and logical operations
  if(ast.type === 'EventExpression'){
    onEE(ast);
  }else{
    onEE(ast.args[0]);
  }

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
