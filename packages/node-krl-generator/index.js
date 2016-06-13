var _ = require('lodash');

var ind = function(n){
  var s = '';
  var i;
  for(i = 0; i < n; i++){
    s += ' ';
  }
  return s;
};

var gen = function gen(ast, indent){
  indent = indent || 0;
  if(!ast){
    return '';
  }
  if(_.isArray(ast)){
    return _.map(ast, function(a){
      return gen(a, indent);
    }).join('\n');
  }
  if(_.has(gen_by_type, ast.type)){
    return gen_by_type[ast.type](ast, indent);
  }
  throw new Error('Unsupported ast node type: ' + ast.type);
};

var gen_by_type = {
  'string': function(ast, indent){
    return JSON.stringify(ast.value);
  },
  'symbol': function(ast, indent){
    return ast.src;
  },
  'ruleset': function(ast, indent){
    return ind(indent) + 'ruleset ' + ast.name + ' {\n'
      + gen(ast.rules, indent + 2)
      + ind(indent) + '}\n';
  },
  'rule': function(ast, indent){
    return ind(indent) + 'rule ' + ast.name + ' {\n'
      + gen(ast.select, indent + 2)
      + gen(ast.actions, indent + 2)
      + ind(indent) + '}\n';
  },
  'select_when': function(ast, indent){
    return ind(indent) + 'select when ' + gen(ast.event_expressions, indent) + '\n';
  },
  'event_expression': function(ast, indent){
    return gen(ast.event_domain, indent) + ' ' +  gen(ast.event_type, indent);
  },
  'send_directive': function(ast, indent){
    var src = ind(indent) + 'send_directive(' + gen(ast.args, indent) + ')';
    if(_.size(_.get(ast, ['with', 'pairs'])) > 0){
      src += ' with\n' + gen(ast['with'], indent + 2) + '\n';
    }
    return src;
  },
  'with_expression': function(ast, indent){
    return _.map(ast.pairs, function(pair){
      var sym = pair[0];
      var val = pair[1];
      return ind(indent) + gen(sym, indent) + ' = ' + gen(val, indent);
    }).join('\n');
  }
};

module.exports = gen;
