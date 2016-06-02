var _ = require('lodash');
var toEstreeObject = require('./toEstreeObject');
var toEstreeFnCtxCallback = require('./toEstreeFnCtxCallback');

module.exports = function(actions_ast){

  var fn_body = [];

  _.each(actions_ast, function(ast){
    if(ast.type === 'send_directive'){
      fn_body.push({
        'type': 'ExpressionStatement',
        'expression': {
          'type': 'CallExpression',
          'callee': {
            'type': 'Identifier',
            'name': 'callback'
          },
          'arguments': [
            {
              'type': 'Identifier',
              'name': 'undefined'
            },
            toEstreeObject({
              type: {
                'type': 'Literal',
                'value': 'directive'
              },
              name: {
                'type': 'Literal',
                'value': ast.args[0].value
              },
              options: toEstreeObject(_.fromPairs(_.map(ast['with'].pairs, function(pair){
                return [pair[0].src, {
                  'type': 'Literal',
                  'value': pair[1].value
                }];
              })))
            })
          ]
        }
      });
    }else{
      throw new Error('Unknown action type: ' + ast.type);
    }
  });

  return toEstreeFnCtxCallback(fn_body);
};
