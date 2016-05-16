module.exports = {
  rules: {
    hello_world: {
      select: function(event){
        return event.domain === 'echo' && event.type === 'hello';
      },
      action: function(event, callback){
        callback(undefined, {
          action: 'say',
          data: {
            something: 'Hello World'
          }
        });
      }
    }
  }
};
