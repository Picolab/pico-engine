//shorthand for this test-ruleset
var mkExpTypeVal = function(type, val){
  return function(ctx, callback){
    var is = ctx.event.domain === 'event_ops'
      && ctx.event.type === type
      && ctx.event.attrs['val'] === val;
    callback(undefined, is);
  };
};

module.exports = {
  rules: {
    bind: {
      select: {
        graph: {
          'event_ops': {
            'bind': {'a': true}
          }
        },
        eventexprs: {
          a: function(ctx, callback){
            ctx.vars.bound_name = ctx.event.attrs['name'];
            callback(undefined, ctx.event.domain === 'event_ops' && ctx.event.type === 'bind');
          }
        },
        state_machine: {
          start: [
            ['a', 'end'],
            [['not', 'a'], 'start']
          ]
        }
      },
      action: function(ctx, callback){
        callback(undefined, {
          type: 'directive',
          name: 'bound',
          options: {
            name: ctx.vars.bound_name
          }
        });
      }
    },
    or: {
      select: {
        graph: {
          'event_ops': {
            'or': {'or_a': true, 'or_b': true}
          }
        },
        eventexprs: {
          or_a: mkExpTypeVal('or', 'a'),
          or_b: mkExpTypeVal('or', 'b')
        },
        state_machine: {
          start: [
            ['or_a', 'end'],
            ['or_b', 'end'],
            [['not', ['or', 'or_a', 'or_b']], 'start']
          ]
        }
      },
      action: function(ctx, callback){
        callback(undefined, {
          type: 'directive',
          name: 'or',
          options: {}
        });
      }
    },
    and: {
      select: {
        graph: {
          'event_ops': {
            'and': {'a': true, 'b': true}
          }
        },
        eventexprs: {
          a: mkExpTypeVal('and', 'a'),
          b: mkExpTypeVal('and', 'b')
        },
        state_machine: {
          start: [
            ['a', 's1'],
            ['b', 's2'],
            [['not', ['or', 'a', 'b']], 'start']
          ],
          s1: [
            ['b', 'end'],
            [['not', 'b'], 's1']
          ],
          s2: [
            ['a', 'end'],
            [['not', 'b'], 's2']
          ]
        }
      },
      action: function(ctx, callback){
        callback(undefined, {
          type: 'directive',
          name: 'and',
          options: {}
        });
      }
    }
  }
};
