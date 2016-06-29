var _ = require('lodash');

var returnFalse = function(e, loc){
  return e('return', e('call', e('id', 'callback', loc), [
    e('nil', loc),
    e('false', loc)
  ], loc), loc);
};

module.exports = function(ast, comp, e){
  //FYI the graph allready vetted the domain and type

  var fn_body = [];

  if((_.size(ast.attributes) + _.size(ast.setting)) > 0){
    fn_body.push(e('var', e('id', 'matches'), e('arr', [])));
    fn_body.push(e('var', e('id', 'm')));
  }
  _.each(ast.attributes, function(a){
    var readAttr = e('get',
      e('id', 'ctx.event.attrs', a.key.loc),
      e('str', a.key.value, a.key.loc),
      a.key.loc
    );

    var regex_exec = e('.',
        comp(a.value),
        e('id', 'exec', a.value.loc), a.value.loc);

    var m = e('id', 'm', a.loc);

    fn_body.push(e(';', e('=', m,
            e('call', regex_exec, [readAttr]),
            a.loc), a.loc));

    fn_body.push(e('if', e('!', m, a.loc), returnFalse(e, a.loc), a.loc));

    fn_body.push(e('if',
          e('>', e('.', m, e('id', 'length', a.loc), a.loc), e('num', 1, a.loc), a.loc),
          e(';',
          e('call', e('id', 'matches.push', a.loc), [
            e('get', m, e('num', 1, a.loc), a.loc)
          ], a.loc), a.loc), a.loc));
  });

  //TODO where: null

  _.each(ast.setting, function(s){
    fn_body.push(e(';',
        e('=',
        comp(s, {is_ctx_var: true}),
        e('get', e('id', 'matches', s.loc), e('num', 0, s.loc), s.loc),
        s.loc), s.loc));
  });

  fn_body.push(e(';', e('call', e('id', 'callback'), [
    e('nil'),
    e(true)
  ])));
  return e('fn', ['ctx', 'callback'], fn_body);
};
