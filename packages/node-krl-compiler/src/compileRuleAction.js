var _ = require('lodash');
var e = require('estree-builder');

module.exports = function(actions_ast){

  var fn_body = [];

  _.each(actions_ast, function(ast){
    if(ast.type === 'send_directive'){
      fn_body.push(e(';', e('call', e.id('callback'), [
        e.nil(),
        e.obj({
          type: e.str('directive'),
          name: e.str(ast.args[0].value),
          options: e.obj(_.fromPairs(_.map(ast['with'].pairs, function(pair){
            return [pair[0].src, e.json(pair[1].value)];
          })))
        })
      ])));
    }else{
      throw new Error('Unknown action type: ' + ast.type);
    }
  });

  return e.fn(['ctx', 'callback'], fn_body);
};
