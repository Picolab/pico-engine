module.exports = {
  provided_query_fns: {
    getName: function(args, callback){
      callback(undefined, 'TODO read name from db');//TODO
    }
  },
  rules: {
    store_name: {
      select: function(event){
        return event.domain === 'hello' && event.type === 'name';
      },
      pre: function(event){
        return {
          passed_name: event.attrs['name']
        };
      },
      action: function(event, context, callback){
        callback(undefined, {
          name: 'store_name',
          data: {
            name: context.passed_name
          }
        });
      },
      always: function(event, context, callback){
        //TODO store name = passed_name
        callback();
      }
    }
  }
};
