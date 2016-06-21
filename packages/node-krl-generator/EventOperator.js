var _ = require('lodash');

var infix_ops = {
  'or': true,
  'and': true,
  'before': true,
  'then': true,
  'after': true
};

var fmtParams = function(ast, ind, gen){
  var src = '(\n';
  src += ind(1) + _.map(ast, function(arg){
    return gen(arg, 1);
  }).join(',\n' + ind(1));
  src += '\n' + ind() + ')';
  return src;
};

module.exports = function(ast, ind, gen){
  if(ast.op === 'any'){
    var src = ast.op + ' ' + gen(ast.args[0]) + ' ';
    return src + fmtParams(_.tail(ast.args), ind, gen);
  }
  if(ast.op === 'within'){
    return gen(ast.args[0]) + '\n' + ind(1) + ast.op + ' ' + gen(ast.args[1]) + ' ' + ast.args[2].value;
  }
  if(ast.op === 'between' || ast.op === 'not between'){
    return gen(ast.args[0]) + ' ' + ast.op + fmtParams(_.tail(ast.args), ind, gen);
  }
  if(infix_ops[ast.op] === true && _.size(ast.args) === 2){
    return '\n' + ind(1) + _.map(ast.args, function(arg){
      return gen(arg, 1);
    }).join('\n' + ind(1) + ast.op + '\n' + ind(1));
  }
  return ast.op + fmtParams(ast.args, ind, gen);
};
