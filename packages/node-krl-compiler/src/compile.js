var _ = require('lodash');
var e = require('estree-builder');

var comp_by_type = {
  'String': function(ast, comp){
    return e.str(ast.value);
  },
  'Identifier': function(ast, comp){
    //TODO work around reserved words etc.
    return e.id(ast.value);
  },
  'Ruleset': function(ast, comp){
    var rules_obj = {};
    _.each(ast.rules, function(rule){
      rules_obj[rule.name.value] = comp(rule);
    });
    return e.obj({
      name: e.str(ast.name.value),
      rules: e.obj(rules_obj)
    });
  },
  'Rule': function(ast, comp){
    return e.obj({
      select: comp(ast.select),
      action: comp(ast.action_block)
    });
  },
  'RuleSelect': function(ast, comp){
    ast = ast.event;//TODO remove this Hack

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


    var exprs_array = [];
    exprs_array.push({
      domain: ast.event_domain.value,
      type: ast.event_type.value
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
  },
  'RuleActionBlock': function(ast, comp){
    return e.fn(['ctx', 'callback'], _.flattenDeep(_.map(ast.actions, function(action){
      return comp(action);
    })));
  },
  'RuleAction': function(ast, comp){
    return e(';', e('call', e.id('callback'), [
      e.nil(),
      e.obj({
        type: e.str('directive'),
        name: e.str(ast.args[0].value),
        options: e.obj(_.fromPairs(_.map(ast['with'], function(dec){
          return [dec.left.value, comp(dec.right)];
        })))
      })
    ]));
  }
};

module.exports = function(ast, options){
  options = options || {};

  var compile = function compile(ast){
    if(!ast){
      throw new Error('Invalid ast node: ' + JSON.stringify(ast));
    }
    if(_.isArray(ast)){
      return _.map(ast, function(a){
        return compile(a);
      });
    }
    if(_.has(comp_by_type, ast.type)){
      return comp_by_type[ast.type](ast, compile);
    }
    throw new Error('Unsupported ast node type: ' + ast.type);
  };

  return compile(ast, 0);
};
