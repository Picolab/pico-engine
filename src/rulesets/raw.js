module.exports = {
  rules: {
    raw_hello: {
      select: function(ctx, callback){
        callback(undefined,
            ctx.event.domain === 'raw' && ctx.event.type === 'hello');
      },
      action: function(ctx, callback){
        callback(undefined, {
          type: 'raw',
          resFn: function(res){
            res.end('raw hello!');
          }
        });
      }
    }
  }
};
