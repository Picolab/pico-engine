module.exports = {
  'name': 'io.picolabs.events',
  'meta': {},
  'rules': {
    'set_attr': {
      'name': 'set_attr',
      'select': {
        'graph': { 'events': { 'bind': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs.$name$);
            if (!m)
              return callback(undefined, false);
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.my_name = matches[0];
            callback(undefined, true);
          }
        },
        'state_machine': {
          'start': [
            [
              'expr_0',
              'end'
            ],
            [
              [
                'not',
                'expr_0'
              ],
              'start'
            ]
          ]
        }
      },
      'action_block': {
        'actions': [function (ctx, callback) {
            callback(undefined, {
              'type': 'directive',
              'name': 'bound',
              'options': { 'name': ctx.vars.my_name }
            });
          }]
      }
    },
    'or_op': {
      'name': 'or_op',
      'select': {
        'graph': {
          'events': {
            'a': { 'expr_0': true },
            'b': { 'expr_1': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            callback(undefined, true);
          },
          'expr_1': function (ctx, callback) {
            callback(undefined, true);
          }
        },
        'state_machine': {
          'start': [
            [
              'expr_0',
              'end'
            ],
            [
              'expr_1',
              'end'
            ],
            [
              [
                'not',
                [
                  'or',
                  'expr_0',
                  'expr_1'
                ]
              ],
              'start'
            ]
          ]
        }
      },
      'action_block': {
        'actions': [function (ctx, callback) {
            callback(undefined, {
              'type': 'directive',
              'name': 'or',
              'options': {}
            });
          }]
      }
    },
    'and_op': {
      'name': 'and_op',
      'select': {
        'graph': {
          'events': {
            'a': { 'expr_0': true },
            'b': { 'expr_1': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            callback(undefined, true);
          },
          'expr_1': function (ctx, callback) {
            callback(undefined, true);
          }
        },
        'state_machine': {
          'start': [
            [
              'expr_0',
              'state_0'
            ],
            [
              'expr_1',
              'state_1'
            ],
            [
              [
                'not',
                [
                  'or',
                  'expr_0',
                  'expr_1'
                ]
              ],
              'start'
            ]
          ],
          'state_0': [
            [
              'expr_1',
              'end'
            ],
            [
              [
                'not',
                'expr_1'
              ],
              'state_0'
            ]
          ],
          'state_1': [
            [
              'expr_0',
              'end'
            ],
            [
              [
                'not',
                'expr_0'
              ],
              'state_1'
            ]
          ]
        }
      },
      'action_block': {
        'actions': [function (ctx, callback) {
            callback(undefined, {
              'type': 'directive',
              'name': 'and',
              'options': {}
            });
          }]
      }
    },
    'and_or': {
      'name': 'and_or',
      'select': {
        'graph': {
          'events': {
            'a': { 'expr_0': true },
            'b': { 'expr_1': true },
            'c': { 'expr_2': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            callback(undefined, true);
          },
          'expr_1': function (ctx, callback) {
            callback(undefined, true);
          },
          'expr_2': function (ctx, callback) {
            callback(undefined, true);
          }
        },
        'state_machine': {
          'start': [
            [
              'expr_0',
              'state_0'
            ],
            [
              'expr_1',
              'state_1'
            ],
            [
              'expr_2',
              'end'
            ],
            [
              [
                'not',
                [
                  'or',
                  'expr_0',
                  [
                    'or',
                    'expr_1',
                    'expr_2'
                  ]
                ]
              ],
              'start'
            ]
          ],
          'state_0': [
            [
              'expr_1',
              'end'
            ],
            [
              [
                'not',
                'expr_1'
              ],
              'state_0'
            ]
          ],
          'state_1': [
            [
              'expr_0',
              'end'
            ],
            [
              [
                'not',
                'expr_0'
              ],
              'state_1'
            ]
          ]
        }
      },
      'action_block': {
        'actions': [function (ctx, callback) {
            callback(undefined, {
              'type': 'directive',
              'name': '(a and b) or c',
              'options': {}
            });
          }]
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuZXZlbnRzIHtcbiAgcnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9XG4gIHJ1bGUgb3Jfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50cyBhIG9yIGV2ZW50cyBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJvclwiKVxuICB9XG4gIHJ1bGUgYW5kX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBldmVudHMgYSBhbmQgZXZlbnRzIGJcbiAgICBzZW5kX2RpcmVjdGl2ZShcImFuZFwiKVxuICB9XG4gIHJ1bGUgYW5kX29yIHtcbiAgICBzZWxlY3Qgd2hlbiAoZXZlbnRzIGEgYW5kIGV2ZW50cyBiKSBvciBldmVudHMgY1xuICAgIHNlbmRfZGlyZWN0aXZlKFwiKGEgYW5kIGIpIG9yIGNcIilcbiAgfVxufSIsImlvLnBpY29sYWJzLmV2ZW50cyIsInJ1bGUgc2V0X2F0dHIge1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50cyBiaW5kIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpO1xuICAgIHNlbmRfZGlyZWN0aXZlKFwiYm91bmRcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWVcbiAgfSIsInNldF9hdHRyIiwic2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSkiLCJldmVudHMgYmluZCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsIm5hbWUgcmUjXiguKikkIyIsInJlI14oLiopJCMiLCJuYW1lIiwibXlfbmFtZSIsInNlbmRfZGlyZWN0aXZlKFwiYm91bmRcIikgd2l0aFxuICAgICAgbmFtZSA9IG15X25hbWUiLCJydWxlIG9yX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBldmVudHMgYSBvciBldmVudHMgYlxuICAgIHNlbmRfZGlyZWN0aXZlKFwib3JcIilcbiAgfSIsIm9yX29wIiwic2VsZWN0IHdoZW4gZXZlbnRzIGEgb3IgZXZlbnRzIGIiLCJldmVudHMgYSIsImV2ZW50cyBiIiwic2VuZF9kaXJlY3RpdmUoXCJvclwiKSIsInJ1bGUgYW5kX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBldmVudHMgYSBhbmQgZXZlbnRzIGJcbiAgICBzZW5kX2RpcmVjdGl2ZShcImFuZFwiKVxuICB9IiwiYW5kX29wIiwic2VsZWN0IHdoZW4gZXZlbnRzIGEgYW5kIGV2ZW50cyBiIiwic2VuZF9kaXJlY3RpdmUoXCJhbmRcIikiLCJydWxlIGFuZF9vciB7XG4gICAgc2VsZWN0IHdoZW4gKGV2ZW50cyBhIGFuZCBldmVudHMgYikgb3IgZXZlbnRzIGNcbiAgICBzZW5kX2RpcmVjdGl2ZShcIihhIGFuZCBiKSBvciBjXCIpXG4gIH0iLCJhbmRfb3IiLCJzZWxlY3Qgd2hlbiAoZXZlbnRzIGEgYW5kIGV2ZW50cyBiKSBvciBldmVudHMgYyIsImV2ZW50cyBjIiwic2VuZF9kaXJlY3RpdmUoXCIoYSBhbmQgYikgb3IgY1wiKSJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWF0Y2hlcyIsIm0iLCJSZWdFeHAiLCJleGVjIiwiY3R4IiwiZXZlbnQiLCJhdHRycyIsIiRuYW1lJCIsImNhbGxiYWNrIiwidW5kZWZpbmVkIiwibGVuZ3RoIiwicHVzaCIsInZhcnMiLCJteV9uYW1lIl0sIm1hcHBpbmdzIjoiQUFBQUEsTUFBQSxDQUFBQyxPQUFBO0FBQUEsRSxRQ0FRLG9CREFSO0FBQUEsRSxRQUFBO0FBQUEsRSxTQUFBO0FBQUEsSSxZRUNFO0FBQUEsTSxRQ0FLLFVEQUw7QUFBQSxNLFVFQ0U7QUFBQSxRLFNBQUEsRSxVQUFBLEUsUUFBQSxFLFVBQUE7QUFBQSxRLGNBQUE7QUFBQSxVLFVDQVksVSxHQUFBLEUsUUFBQSxFO1lBQUEsSUFBQUMsTyxHQUFBLEc7WUFBQSxJ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QWEsVSxHQUFBLEUsUUFBQSxFO1lBQUFELFFBQUEsQ0FBQUMsU0FBQSxRO1dTQWI7QUFBQSxVLFVSQTBCLFUsR0FBQSxFLFFBQUEsRTtZQUFBRCxRQUFBLENBQUFDLFNBQUEsUTtXUUExQjtBQUFBLFUsVUNBdUMsVSxHQUFBLEUsUUFBQSxFO1lBQUFELFFBQUEsQ0FBQUMsU0FBQSxRO1dEQXZDO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsUzs7O2NBQUEsUTtjQUFBLFM7OztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7O2tCQUFBLEk7a0JBQUEsUTs7b0JBQUEsSTtvQkFBQSxRO29CQUFBLFE7Ozs7Y0FBQSxPOztXQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsUzs7V0FBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLFM7O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxNLGdCSUVFO0FBQUEsUSxXQUFBLFcsR0FBQSxFLFFBQUEsRTtZQUFBRCxRQUFBLENBQUFDLFNBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUE7QUFBQSxlO1dBQUE7QUFBQSxPSkZGO0FBQUEsS3JCZEY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
