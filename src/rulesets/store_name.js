module.exports = {
  provided_functions: {
    getName: {
      type: 'query',
      fn: function(ctx, callback){
        ctx.db.getEntVar(ctx.pico.id, 'name', callback);
      }
    },
    getAppVar: {
      type: 'query',
      fn: function(ctx, callback){
        ctx.db.getAppVar(ctx.rid, 'appvar', callback);
      }
    }
  },
  rules: {
    store_name: {
      select: {
        graph: {
          'store': {
            'name': {'a': true}
          }
        },
        eventexprs: {
          a: function(ctx, callback){
            callback(undefined, ctx.event.domain === 'store' && ctx.event.type === 'name');
          }
        },
        state_machine: {
          start: [
            ['a', 'end'],
            [['not', 'a'], 'start']
          ]
        }
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
      select: {
        graph: {
          'store': {
            'appvar': {'a': true}
          }
        },
        eventexprs: {
          a: function(ctx, callback){
            callback(undefined, ctx.event.domain === 'store' && ctx.event.type === 'appvar');
          }
        },
        state_machine: {
          start: [
            ['a', 'end'],
            [['not', 'a'], 'start']
          ]
        }
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
            ctx.rule.rid,
            'appvar',
            ctx.vars.appvar,
            callback);
      }
    }
  }
};
