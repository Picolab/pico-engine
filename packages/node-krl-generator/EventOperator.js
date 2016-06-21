var _ = require('lodash');

var infix_ops = {
  'or': true,
  'and': true,
  'before': true,
  'then': true,
  'after': true
};

var op_n_args = {
  'any': true,
  'count': true,
  'repeat': true
};

var aggregators = {
  'max': true,
  'min': true,
  'sum': true,
  'avg': true,
  'push': true
};

var fmtArgs = function(ast, ind, gen){
  var src = '(\n';
  src += ind(1) + _.map(ast, function(arg){
    return gen(arg, 1);
  }).join(',\n' + ind(1));
  src += '\n' + ind() + ')';
  return src;
};

module.exports = function(ast, ind, gen){
  if(op_n_args[ast.op] === true){
    var src = ast.op + ' ' + gen(ast.args[0]) + ' ';
    return src + fmtArgs(_.tail(ast.args), ind, gen);
  }
  if(aggregators[ast.op] === true){
    return gen(ast.args[0]) + ' ' + ast.op + '(' + _.map(_.tail(ast.args), function(arg){
      return gen(arg);
    }).join(', ') + ')';
  }
  if(ast.op === 'within'){
    return gen(ast.args[0]) + '\n' + ind(1) + ast.op + ' ' + gen(ast.args[1]) + ' ' + ast.args[2].value;
  }
  if(ast.op === 'between' || ast.op === 'not between'){
    return gen(ast.args[0]) + ' ' + ast.op + fmtArgs(_.tail(ast.args), ind, gen);
  }
  if(infix_ops[ast.op] === true && _.size(ast.args) === 2){
    return _.map(ast.args, function(arg){
      return gen(arg);
    }).join('\n' + ind(1) + ast.op + '\n' + ind(1));
  }
  return ast.op + fmtArgs(ast.args, ind, gen);
};
