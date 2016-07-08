var _ = require('lodash');
var wrapKRLType = require('../wrapKRLType');

module.exports = function(ast, comp, e){
  //FYI the graph allready vetted the domain and type

  var fn_body = [];

  if(!_.isEmpty(ast.attributes)){
    fn_body.push(e('var', 'matches',
            e('call', e('id', 'ctx.event.attrs.getMatches'), [
              e('array', _.map(ast.attributes, function(a){
                return comp(a.value);
              }))
            ])));
    fn_body.push(e('if', e('!', e('id', 'matches')), e('return', e('false'))));
  }

  //TODO ast.where

  _.each(ast.setting, function(s){
    fn_body.push(e(';',
      e('call', e('id', 'ctx.scope.set', s.loc), [
        e('str', s.value, s.loc),
        wrapKRLType(e, 'String', [
          e('get', e('id', 'matches', s.loc), e('num', 0, s.loc), s.loc)
        ])
      ], s.loc), s.loc));
  });

  fn_body.push(e('return', e(true)));

  return e('fn', ['ctx'], fn_body);
};
