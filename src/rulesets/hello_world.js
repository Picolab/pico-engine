module.exports = {
  provided_functions: {
    hello: {
      type: 'query',
      fn: function(ctx, callback){
        callback(undefined, 'Hello ' + ctx.args.obj);
      }
    }
  },
  rules: {
    hello_world: {
      select: {
        graph: {
          'echo': {
            'hello': {'a': true}
          }
        },
        eventexprs: {
          a: function(ctx){
            return ctx.event.domain === 'echo' && ctx.event.type === 'hello';
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
          name: 'say',
          options: {
            something: 'Hello World'
          }
        });
      }
    }
  }
};
