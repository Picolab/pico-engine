var _ = require('lodash');
//TODO remove from package.json var toId = require('to-js-identifier');
var mkTree = require('estree-builder');

var mkDbCall = function(e, method, args){
  var to_call = 'ctx.db.' + method + 'Future';
  return e('call', e('.', e('call', e('id', to_call), args), e('id', 'wait')), []);
};

var comp_by_type = {
  'String': function(ast, comp, e){
    return e('call', e('id', 'ctx.krl.String'), [e('string', ast.value)]);
  },
  'Number': function(ast, comp, e){
    return e('number', ast.value);
  },
  'Identifier': function(ast, comp, e){
    return e('call', e('id', 'ctx.scope.get'), [e('str', ast.value)]);
  },
  'Chevron': function(ast, comp, e){
    if(ast.value.length < 1){
      return e('call', e('id', 'ctx.krl.String'), []);
    }
    var compElm = function(elm){
      if(elm.type === 'String'){
        return e('string', elm.value, elm.loc);
      }
      return e('call', e('id', 'ctx.krl.beesting'), [comp(elm)], elm.loc);
    };
    var curr = compElm(ast.value[0]);
    var i = 1;
    while(i < ast.value.length){
      curr = e('+', curr, compElm(ast.value[i]));
      i++;
    }
    return e('call', e('id', 'ctx.krl.String'), [curr]);
  },
  'Boolean': function(ast, comp, e){
    return e(ast.value ? 'true' : 'false');
  },
  'RegExp': function(ast, comp, e){
    var flags = '';
    if(ast.value.global){
      flags += 'g';
    }
    if(ast.value.ignoreCase){
      flags += 'i';
    }
    return e('new', e('id', 'RegExp'), [
      e('str', ast.value.source),
      e('str', flags)
    ]);
  },
  'DomainIdentifier': function(ast, comp, e){
    if(ast.domain === 'ent'){
      return mkDbCall(e, 'getEntVar', [
        e('id', 'ctx.pico.id'),
        e('str', ast.value)
      ]);
    }else if(ast.domain === 'app'){
      return mkDbCall(e, 'getAppVar', [
        e('id', 'ctx.rid'),
        e('str', ast.value)
      ]);
    }
    throw new Error('Only ent:* and app:* DomainIdentifiers are supported');
  },
  'MemberExpression': function(ast, comp, e){
    if(ast.method === 'dot'){
      if(ast.property.type === 'Identifier'){
        //using 'get' rather than . b/c we don't want to mess
        //with reserved javascript properties i.e. "prototype"
        return e('get', comp(ast.object), e('str', ast.property.value, ast.property.loc));
      }
      return e('get', comp(ast.object), comp(ast.property));
    }
    throw new Error('Unsupported MemberExpression method: ' + ast.method);
  },
  'Map': function(ast, comp, e){
    return e('obj-raw', comp(ast.value));
  },
  'MapKeyValuePair': function(ast, comp, e){
    return e('obj-prop', e('string', ast.key.value + '', ast.key.loc), comp(ast.value));
  },
  'Application': function(ast, comp, e){
    return e('call', comp(ast.callee), [
      e('id', 'ctx'),
      e('array', comp(ast.args))
    ]);
  },
  'InfixOperator': function(ast, comp, e){
    if(ast.op === '+'){
      return e('+', comp(ast.left), comp(ast.right));
    }
    throw new Error('Unsuported InfixOperator.op: ' + ast.op);
  },
  'Function': function(ast, comp, e){
    var body = _.map(ast.params, function(param, i){
      var loc = param.loc;
      return e(';', e('call', e('id', 'ctx.scope.set', loc), [
        e('str', param.value, loc),
        e('call',
          e('id', 'ctx.getArg', loc),
          [
            e('id', 'ctx.args', loc),
            e('string', param.value, loc),
            e('number', i, loc)
          ],
          loc
        )
      ], loc), loc);
    });
    _.each(ast.body, function(part, i){
      if(i < (ast.body.length - 1)){
        return body.push(comp(part));
      }
      if(part.type === 'ExpressionStatement'){
        part = part.expression;
      }
      return body.push(e('return', comp(part)));
    });
    return e('call', e('id', 'ctx.krl.Closure'), [
      e('id', 'ctx'),
      e('fn', ['ctx'], body)
    ]);
  },
  'Declaration': function(ast, comp, e){
    if(ast.op === '='){
      if(ast.left
          && ast.left.type === 'DomainIdentifier'
          && ast.left.domain === 'ent'
        ){
        return e(';', mkDbCall(e, 'putEntVar', [
          e('id', 'ctx.pico.id'),
          e('str', ast.left.value, ast.left.loc),
          comp(ast.right)
        ]));
      }else if(ast.left
          && ast.left.type === 'DomainIdentifier'
          && ast.left.domain === 'app'
        ){
        return e(';', mkDbCall(e, 'putAppVar', [
          e('id', 'ctx.rid'),
          e('str', ast.left.value, ast.left.loc),
          comp(ast.right)
        ]));
      }
      return e(';', e('call', e('id', 'ctx.scope.set'), [
        e('str', ast.left.value, ast.left.loc),
        comp(ast.right)
      ]));
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
    var rs = {
      name: comp(ast.name),
      meta: e('obj-raw', comp(ast.meta))
    };
    if(!_.isEmpty(ast.global)){
      rs.global = e('fn', ['ctx'], comp(ast.global));
    }
    rs.rules = e('obj', rules_obj);
    return [
      e(';', e('=', e('id', 'module.exports'), e('obj', rs)))
    ];
  },
  'RulesetName': function(ast, comp, e){
    return e('string', ast.value);
  },
  'RulesetMetaProperty': function(ast, comp, e){
    var key = ast.key.value;
    var val = e('nil');
    if(key === 'shares'){
      val = e('arr', _.map(ast.value.ids, function(id){
        return e('str', id.value, id.loc);
      }));
    }else if(ast.value.type === 'String'){
      val = e('string', ast.value.value, ast.value.loc);
    }else if(ast.value.type === 'Chevron'){
      val = e('string', ast.value.value[0].value, ast.value.value[0].loc);
    }else if(ast.value.type === 'Boolean'){
      val = comp(ast.value);
    }
    return e('obj-prop', e('str', key, ast.key.loc), val);
  },
  'Rule': function(ast, comp, e){
    var rule = {
      name: e('string', ast.name.value, ast.name.loc)
    };
    if(ast.rule_state !== 'active'){
      rule.rule_state = e('string', ast.rule_state);
    }
    if(ast.select){
      rule.select = comp(ast.select);
    }
    if(!_.isEmpty(ast.prelude)){
      rule.prelude = e('fn', ['ctx'], comp(ast.prelude));
    }
    if(ast.action_block){
      rule.action_block = comp(ast.action_block);
    }
    if(ast.postlude){
      rule.postlude = comp(ast.postlude);
    }
    return e('obj', rule);
  },
  'RuleSelect': require('./c/RuleSelect'),
  'EventExpression': require('./c/EventExpression'),
  'RuleActionBlock': function(ast, comp, e){
    var block = {};
    //TODO "condition": COND,
    //TODO "block_type": "choose",
    block.actions = e('arr', _.map(ast.actions, function(action){
      return comp(action);
    }));
    return e('obj', block);
  },
  'RuleAction': function(ast, comp, e){
    var fn_body = [];
    fn_body.push(e('return', e('obj', {
      type: e('str', 'directive'),
      name: e('str', ast.args[0].value),
      options: e('obj', _.fromPairs(_.map(ast['with'], function(dec){
        return [dec.left.value, comp(dec.right)];
      })))
    })));
    return e('fn', ['ctx'], fn_body);
  },
  'RulePostlude': require('./c/RulePostlude')
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
