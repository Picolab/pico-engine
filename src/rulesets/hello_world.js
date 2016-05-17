module.exports = {
  provided_query_fns: {
    hello: function(ctx, callback){
      callback(undefined, 'Hello ' + ctx.args.obj);
    }
  },
  rules: {
    hello_world: {
      select: function(event){
        return event.domain === 'echo' && event.type === 'hello';
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
