module.exports = function(e, name, args, loc){
  return e('call',
    e('get',
      e('id', 'ctx.krl.stdlib', loc),
      e('string', name, loc),
      loc
    ),
    args,
    loc
  );
};
