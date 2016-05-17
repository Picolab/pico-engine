module.exports = {
  provided_query_fns: {
    hello: function(args, callback){
      callback(undefined, 'Hello ' + args.obj);
    }
  },
  rules: {
    hello_world: {
      select: function(event){
        return event.domain === 'echo' && event.type === 'hello';
      },
      action: function(event, context, callback){
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
