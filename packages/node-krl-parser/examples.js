var _ = require('lodash');
var rmLoc = require('./rmLoc');
var parser = require('./');
var normalizeAST = require('./normalizeASTForTestCompare');

var examples = {
  '### Literals': [
    '"hello world"',
    '-12.3',
    'thing',
    'true',
    '[a, b, c]',
    '{"one": a}'
  ],
  '### Conditionals': [
    'a => b | c',
    'a => b |\nc => d |\n     e'
  ],
  '### Functions': [
    'function(a){\n  b\n}'
  ]
};

var ind = function(n){                                                          
  var s = '';                                                                   
  var i;                                                                        
  for(i = 0; i < n; i++){                                                       
    s += ' ';                                                                   
  }                                                                             
  return s;                                                                     
};   

var printAST = function(ast, i, indent_size){
  indent_size = indent_size || 2;
  if(_.isArray(ast)){
    var arr_strs = _.map(ast, function(ast){
      return printAST(ast, i + indent_size, indent_size);
    });
    var flat_array = '[ ' + arr_strs.join(' , ') + ' ]';
    if((flat_array.indexOf('\n') < 0) && (flat_array.length < 20)){
      return flat_array;
    }
    return '[\n'
      + _.map(arr_strs, function(str){
        return ind(i + indent_size) + str;
      }).join(',\n')
      + '\n' + ind(i) + ']';
  }
  if(_.isPlainObject(ast)){
    if(ast.type === 'Identifier' && i !== 0){
      return ast.value;
    }
    return '{\n'
      + _.map(ast, function(value, key){
        var k = JSON.stringify(key);
        var v = printAST(value, i + indent_size, indent_size);
        return ind(i + indent_size) + k + ': ' + v;
      }).join('\n')
      + '\n' + ind(i) + '}';
  }
  return JSON.stringify(ast);
};

_.each(examples, function(srcs, head){
  console.log();
  console.log(head);
  console.log();
  console.log('```js\n' + _.map(srcs, function(src){
    var ast = normalizeAST(rmLoc(parser(src)));
    ast = _.isArray(ast) && _.size(ast) === 1 ? _.head(ast) : ast;

    return src + '\n' + printAST(ast, 0, 2);
  }).join('\n\n') + '\n```');
})
