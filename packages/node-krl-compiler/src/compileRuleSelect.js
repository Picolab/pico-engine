var _ = require('lodash');
var e = require('estree-builder');

var estCTXEventProp = function(prop){
  return e('.', e('.', e.id('ctx'), e.id('event')), e.id(prop));
};

var eventExprToEstree = function(expr){
  var fn_body = [];
  fn_body.push(e(';', e('call', e.id('callback'), [
    e.nil(),
    e('&&',
      e('===', estCTXEventProp('domain'), e.str('echo')),
      e('===', estCTXEventProp('type'), e.str('hello'))
    )
  ])));
  return e.fn(['ctx', 'callback'], fn_body);
};

module.exports = function(ast){
  if(ast.type !== 'select_when'){
    throw new Error('Unexpected select type: ' + ast.type);
  }

  var exprs_array = [];
  //TODO recurse through the expressions
  ast = ast.event_expressions;

  if(ast.type !== 'event_expression'){
    throw new Error('Unexpected event expression type: ' + ast.type);
  }

  exprs_array.push({
    domain: ast.event_domain.src,
    type: ast.event_type.src
    //TODO regex, capture, read vars etc...
  });

  var graph = {};
  var eventexprs = {};
  var state_machine = {start: []};
  _.each(exprs_array, function(expr, i){
    var id = 'expr_' + i;
    _.set(graph, [expr.domain, expr.type, id], true);
    eventexprs[id] = eventExprToEstree(expr);

    state_machine.start.push([id, 'end']);
    state_machine.start.push([['not', id], 'start']);
  });

  return e.obj({
    graph: e.json(graph),
    eventexprs: e.obj(eventexprs),
    state_machine: e.json(state_machine)
  });
};
