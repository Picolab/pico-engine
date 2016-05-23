module.exports = {
  rules: {
    bind: {
      select: function(ctx, callback){
        //TODO bound_name here, not in pre
        callback(undefined,
            ctx.event.domain === 'event_ops' && ctx.event.type === 'bind');
      },
      pre: function(ctx, callback){
        callback(undefined, {
          bound_name: ctx.event.attrs['name']
        });
      },
      action: function(ctx, callback){
        callback(undefined, {
          type: 'directive',
          name: 'bound',
          options: {
            name: ctx.vars.bound_name
          }
        });
      }
    }
  }
};
