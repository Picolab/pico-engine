module.exports = {
  provided_query_fns: {
    getName: function(ctx, callback){
      ctx.db.getEntVar(ctx.pico.id, 'name', callback);
    },
    getAppVar: function(ctx, callback){
      ctx.db.getAppVar(ctx.meta.rid, 'appvar', callback);
    }
  },
  rules: {
    store_name: {
      select: function(ctx, callback){
        callback(undefined,
            ctx.event.domain === 'store' && ctx.event.type === 'name');
      },
      pre: function(ctx, callback){
        callback(undefined, {
          passed_name: ctx.event.attrs['name']
        });
      },
      action: function(ctx, callback){
        callback(undefined, {
          type: 'directive',
          name: 'store_name',
          options: {
            name: ctx.vars.passed_name
          }
        });
      },
      always: function(ctx, callback){
        var val = ctx.vars.passed_name;
        ctx.db.putEntVar(ctx.pico.id, 'name', val, callback);
      }
    },
    store_appvar: {
      select: function(ctx, callback){
        callback(undefined,
            ctx.event.domain === 'store' && ctx.event.type === 'appvar');
      },
      pre: function(ctx, callback){
        callback(undefined, {
          appvar: ctx.event.attrs['appvar']
        });
      },
      action: function(ctx, callback){
        callback(undefined, {
          type: 'directive',
          name: 'store_appvar',
          options: {
            name: ctx.vars.appvar
          }
        });
      },
      always: function(ctx, callback){
        ctx.db.putAppVar(
            ctx.meta.rid,
            'appvar',
            ctx.vars.appvar,
            callback);
      }
    }
  }
};
