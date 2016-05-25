module.exports = {
  rules: {
    bind: {
      select: {
        eventexprs: {
          a: function(ctx){
            //TODO bound_name here, not in pre
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
