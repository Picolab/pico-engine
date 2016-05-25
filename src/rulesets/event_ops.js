module.exports = {
  rules: {
    bind: {
      select: {
        eventexprs: {
          a: function(ctx){
            ctx.vars.bound_name = ctx.event.attrs['name'];
            return ctx.event.domain === 'event_ops' && ctx.event.type === 'bind';
          }
        },
        state_machine: {
          start: [
            ['a', 'end'],
            [['not', 'a'], 'start']
          ]
        }
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
