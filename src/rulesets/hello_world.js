module.exports = {
  provided_query_fns: {
    hello: function(ctx, callback){
      callback(undefined, 'Hello ' + ctx.args.obj);
    }
  },
  rules: {
    hello_world: {
      select: function(ctx, callback){
        callback(undefined,
            ctx.event.domain === 'echo' && ctx.event.type === 'hello');
      },
      action: function(ctx, callback){
        callback(undefined, {
          name: 'say',
          data: {
            something: 'Hello World'
          }
        });
      }
    }
  }
};
