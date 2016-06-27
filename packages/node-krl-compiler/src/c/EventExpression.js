module.exports = function(ast, comp, e){
  var estEventProp = function(prop){
    var loc = ast['event_' + prop].loc;
    var est_ctx = e('.', e('.', e('id', 'ctx', loc), e('id', 'event', loc), loc), e('id', prop, loc), loc);
    return e('===', est_ctx, e('str', ast['event_' + prop].value, loc), loc);
  };

  var fn_body = [];
  fn_body.push(e(';', e('call', e('id', 'callback'), [
    e('nil'),
    e('&&',
      estEventProp('domain'),
      estEventProp('type')
    )
  ])));
  return e('fn', ['ctx', 'callback'], fn_body);
};
