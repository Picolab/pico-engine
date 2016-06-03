var _ = require('lodash');
var e = require('estree-builder');

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
            e.obj({
              type: {
                'type': 'Literal',
                'value': 'directive'
              },
              name: {
                'type': 'Literal',
                'value': ast.args[0].value
              },
              options: e.obj(_.fromPairs(_.map(ast['with'].pairs, function(pair){
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

  return e.fn(['ctx', 'callback'], fn_body);
};
