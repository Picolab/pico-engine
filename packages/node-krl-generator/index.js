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
    }).join("\n");
  }
  if(ast.type === 'ruleset'){
    return ind(indent) + "ruleset " + ast.name + " {\n"
      + gen(ast.rules, indent + 2)
      + ind(indent) + "}\n";
  }
  if(ast.type === 'rule'){
    return ind(indent) + "rule " + ast.name + " {\n"
      + gen(ast.select, indent + 2)
      + gen(ast.actions, indent + 2)
      + ind(indent) + "}\n";
  }
  if(ast.type === 'select_when'){
    return ind(indent) + "select when " + gen(ast.event_expressions, indent) + "\n";
  }
  if(ast.type === 'event_expression'){
    return gen(ast.event_domain, indent) + " " +  gen(ast.event_type, indent);
  }
  if(ast.type === 'symbol'){
    return ast.src;
  }
  if(ast.type === 'send_directive'){
    var src = ind(indent) + 'send_directive(' + gen(ast.args, indent) + ')';
    if(_.size(_.get(ast, ['with', 'pairs'])) > 0){
      src += ' with\n' + gen(ast['with'], indent + 2) + '\n';
    }
    return src;
  }
  if(ast.type === 'string'){
    return JSON.stringify(ast.value);
  }
  if(ast.type === 'with_expression'){
    return _.map(ast.pairs, function(pair){
      var sym = pair[0];
      var val = pair[1];
      return ind(indent) + gen(sym, indent) + ' = ' + gen(val, indent);
    }).join("\n");
  }
  throw new Error('Unsupported ast node type: ' + ast.type);
};

module.exports = gen;
