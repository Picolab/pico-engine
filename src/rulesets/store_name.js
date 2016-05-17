var keyForPicoVar = function(pico_id, var_name){
  return ['pico', pico_id, 'vars', var_name];
};

module.exports = {
  provided_query_fns: {
    getName: function(ctx, callback){
      ctx.db.get(keyForPicoVar(ctx.pico.id, 'name'), callback);
    }
  },
  rules: {
    store_name: {
      select: function(ctx, callback){
        callback(undefined,
            ctx.event.domain === 'store' && ctx.event.type === 'name');
      },
      pre: function(ctx, callback){
        callback(undefined, {
          passed_name: ctx.event.attrs['name']
        });
      },
      action: function(ctx, callback){
        callback(undefined, {
          name: 'store_name',
          data: {
            name: ctx.vars.passed_name
          }
        });
      },
      always: function(ctx, callback){
        var key = keyForPicoVar(ctx.pico.id, 'name');
        ctx.db.put(key, ctx.vars.passed_name, callback);
      }
    }
  }
};
