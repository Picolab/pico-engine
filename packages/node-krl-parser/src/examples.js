var _ = require('lodash');
var rmLoc = require('./rmLoc');
var parser = require('./');
var normalizeAST = require('./normalizeASTForTestCompare');

var examples = {
  '### Rulesets': [
    [
      'ruleset hello_world {',
      '  rule echo_hello {',
      '    select when echo hello',
      '  }',
      '}'
    ].join('\n')
  ],
  '### KRL Expression language': [],
  '#### Literals': [
    '"hello world"',
    '-12.3',
    'thing',
    'true',
    're#^My name is (.*)#i',
    '[A, B, C]',
    '{"one": A}',
    '<<\n  hello #{name}!\n  >>'
  ],
  '#### Assignment': [
    'A = B'
  ],
  '#### Infix Operators': [
    'A && B',
    'A + B + C',
    'A + B * C',
    'A < B',
    'A cmp B',
    'A <=> B'
  ],
  '#### Conditionals': [
    'A => B | C',
    'A => B |\nC => D |\n     E'
  ],
  '#### Functions': [
    'function(A){\n  B\n}',
    'A(B,C)'
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
    if(ast.type === 'Identifier' && i !== 0 && /^[A-Z]+$/.test(ast.value)){
      return ast.value;
    }
    return '{\n'
      + _.map(ast, function(value, key){
        var k = JSON.stringify(key);
        var v = printAST(value, i + indent_size, indent_size);
        if(key === 'value' && ast.type === 'RegExp'){
          v = ast.value;
        }
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
  if(_.isEmpty(srcs)){
    return;
  }
  console.log('```js\n' + _.map(srcs, function(src){
    var ast = normalizeAST(rmLoc(parser(src)));
    ast = _.isArray(ast) && _.size(ast) === 1 ? _.head(ast) : ast;

    return src + '\n' + printAST(ast, 0, 2);
  }).join('\n\n') + '\n```');
})
