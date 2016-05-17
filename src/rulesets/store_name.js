module.exports = {
  provided_query_fns: {
    getName: function(args, context, callback){
      context.db.get('vars!app!name', callback);
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
        //TODO key on ruleset id?
        //TODO store as `ent` not `app`
        context.db.put('vars!app!name', context.passed_name, callback);
      }
    }
  }
};
