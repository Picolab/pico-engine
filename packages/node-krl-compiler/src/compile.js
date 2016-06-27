var _ = require('lodash');
var toId = require('to-js-identifier');
var mkTree = require('estree-builder');

var comp_by_type = {
  'String': function(ast, comp, e){
    return e('string', ast.value);
  },
  'Identifier': function(ast, comp, e){
    return e('id', toId(ast.value));
  },
  'Chevron': function(ast, comp, e){
    if(ast.value.length !== 1){
      throw new Error('TODO finish implementing Chevron compiler');
    }
    return comp(ast.value[0]);
  },
  'Boolean': function(ast, comp, e){
    return e(ast.value ? 'true' : 'false');
  },
  'Application': function(ast, comp, e){
    return e('call',
      comp(ast.callee),
      comp(ast.args)
    );
  },
  'InfixOperator': function(ast, comp, e){
    if(ast.op === '+'){
      return e('+', comp(ast.left), comp(ast.right));
    }
    throw new Error('Unsuported InfixOperator.op: ' + ast.op);
  },
  'Function': function(ast, comp, e){
    return e('function', _.map(ast.params, function(param){
      return param.value;
    }), _.map(ast.body, function(part, i){
      if(i < (ast.body.length - 1)){
        return comp(part);
      }
      return e('return', comp(part).expression, part.loc);
    }));
  },
  'Declaration': function(ast, comp, e){
    if(ast.op === '='){
      return e('var', comp(ast.left), comp(ast.right));
    }
    throw new Error('Unsuported Declaration.op: ' + ast.op);
  },
  'ExpressionStatement': function(ast, comp, e){
    return e(';', comp(ast.expression));
  },
  'Ruleset': function(ast, comp, e){
    var rules_obj = {};
    _.each(ast.rules, function(rule){
      rules_obj[rule.name.value] = comp(rule);
    });
    return comp(ast.global).concat([
      e(';', e('=', e('.', e('id', 'module'), e('id', 'exports')), e('obj', {
        name: comp(ast.name),
        meta: e('obj-raw', comp(ast.meta)),
        rules: e('obj', rules_obj)
      })))
    ]);
  },
  'RulesetName': function(ast, comp, e){
    return e('string', ast.value);
  },
  'RulesetMetaProperty': function(ast, comp, e){
    var key = ast.key.value;
    var val = e('nil');
    if(_.includes([
      'String', 'Boolean', 'Chevron'
    ], _.get(ast, 'value.type'))){
      val = comp(ast.value);
    }
    if(key === 'shares'){
      val = e('obj-raw', _.map(ast.value.ids, function(id){
        return e('obj-prop', e('str', id.value, id.loc), comp(id));
      }));
    }
    return e('obj-prop', e('str', key, ast.key.loc), val);
  },
  'Rule': function(ast, comp, e){
    return e('obj', {
      select: comp(ast.select),
      action: ast.action_block ? comp(ast.action_block) : e('nil')
    });
  },
  'RuleSelect': function(ast, comp, e){
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
  },
  'EventExpression': function(ast, comp, e){
    var estEventProp = function(prop){
      var loc = ast['event_' + prop].loc;
      var est_ctx = e('.', e('.', e('id', 'ctx', loc), e('id', 'event', loc), loc), e('id', prop, loc), loc);
      return e('===', est_ctx, e('str', ast['event_' + prop].value, loc), loc);
    };

    var fn_body = [];
    fn_body.push(e(';', e('call', e('id', 'callback'), [
      e('nil'),
      e('&&',
        estEventProp('domain'),
        estEventProp('type')
      )
    ])));
    return e('fn', ['ctx', 'callback'], fn_body);
  },
  'RuleActionBlock': function(ast, comp, e){
    return e('fn', ['ctx', 'callback'], _.flattenDeep(_.map(ast.actions, function(action){
      return comp(action);
    })));
  },
  'RuleAction': function(ast, comp, e){
    return e(';', e('call', e('id', 'callback'), [
      e('nil'),
      e('obj', {
        type: e('str', 'directive'),
        name: e('str', ast.args[0].value),
        options: e('obj', _.fromPairs(_.map(ast['with'], function(dec){
          return [dec.left.value, comp(dec.right)];
        })))
      })
    ]));
  }
};

var isKRL_loc = function(loc){
  return _.isPlainObject(loc) && _.has(loc, 'start') && _.has(loc, 'end');
};

module.exports = function(ast, options){
  options = options || {};

  var toLoc = options.toLoc || _.noop;

  var mkE = function(default_krl_loc){
    var default_loc = toLoc(default_krl_loc.start, default_krl_loc.end);

    return function(){
      var args = Array.prototype.slice.call(arguments);
      var last_i = args.length - 1;
      var last = args[last_i];
      if(isKRL_loc(last)){
        args[last_i] = toLoc(last.start, last.end);
      }else{
        args.push(default_loc);
      }
      return mkTree.apply(null, args);
    };
  };

  var compile = function compile(ast){
    if(_.isArray(ast)){
      return _.map(ast, function(a){
        return compile(a);
      });
    }else if(!_.has(ast, 'type')){
      throw new Error('Invalid ast node: ' + JSON.stringify(ast));
    }else if(!_.has(comp_by_type, ast.type)){
      throw new Error('Unsupported ast node type: ' + ast.type);
    }
    return comp_by_type[ast.type](ast, compile, mkE(ast.loc));
  };

  return compile(ast, 0);
};
