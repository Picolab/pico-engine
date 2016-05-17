module.exports = {
  provided_query_fns: {
    getName: function(ctx, callback){
      ctx.db.get('vars!app!name', callback);
    }
  },
  rules: {
    store_name: {
      select: function(event){
        return event.domain === 'hello' && event.type === 'name';
      },
      pre: function(ctx, callback){
        callback(undefined, {
          passed_name: ctx.event.attrs['name']
        });
      },
      action: function(ctx, callback){
        callback(undefined, {
          name: 'store_name',
          data: {
            name: ctx.vars.passed_name
          }
        });
      },
      always: function(ctx, callback){
        //TODO key on ruleset id?
        //TODO store as `ent` not `app`
        ctx.db.put('vars!app!name', ctx.vars.passed_name, callback);
      }
    }
  }
};
