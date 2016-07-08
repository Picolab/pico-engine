module.exports = {
  'name': 'io.picolabs.events',
  'meta': {},
  'rules': {
    'set_attr': {
      'name': 'set_attr',
      'select': {
        'graph': { 'events': { 'bind': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx) {
            var matches = ctx.event.getAttrMatches([[
                'name',
                new ctx.krl.RegExp('^(.*)$', '')
              ]]);
            if (!matches)
              return false;
            ctx.scope.set('my_name', new ctx.krl.String(matches[0]));
            return true;
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
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'bound',
              'options': { 'name': ctx.scope.get('my_name') }
            };
          }]
      }
    },
    'or_op': {
      'name': 'or_op',
      'select': {
        'graph': {
          'events_or': {
            'a': { 'expr_0': true },
            'b': { 'expr_1': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx) {
            return true;
          },
          'expr_1': function (ctx) {
            return true;
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
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'or',
              'options': {}
            };
          }]
      }
    },
    'and_op': {
      'name': 'and_op',
      'select': {
        'graph': {
          'events_and': {
            'a': { 'expr_0': true },
            'b': { 'expr_1': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx) {
            return true;
          },
          'expr_1': function (ctx) {
            return true;
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
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': 'and',
              'options': {}
            };
          }]
      }
    },
    'and_or': {
      'name': 'and_or',
      'select': {
        'graph': {
          'events_andor': {
            'a': { 'expr_0': true },
            'b': { 'expr_1': true },
            'c': { 'expr_2': true }
          }
        },
        'eventexprs': {
          'expr_0': function (ctx) {
            return true;
          },
          'expr_1': function (ctx) {
            return true;
          },
          'expr_2': function (ctx) {
            return true;
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
        'actions': [function (ctx) {
            return {
              'type': 'directive',
              'name': '(a and b) or c',
              'options': {}
            };
          }]
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuZXZlbnRzIHtcbiAgcnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9XG4gIHJ1bGUgb3Jfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19vciBhIG9yIGV2ZW50c19vciBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJvclwiKVxuICB9XG4gIHJ1bGUgYW5kX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBldmVudHNfYW5kIGEgYW5kIGV2ZW50c19hbmQgYlxuICAgIHNlbmRfZGlyZWN0aXZlKFwiYW5kXCIpXG4gIH1cbiAgcnVsZSBhbmRfb3Ige1xuICAgIHNlbGVjdCB3aGVuIChldmVudHNfYW5kb3IgYSBhbmQgZXZlbnRzX2FuZG9yIGIpIG9yIGV2ZW50c19hbmRvciBjXG4gICAgc2VuZF9kaXJlY3RpdmUoXCIoYSBhbmQgYikgb3IgY1wiKVxuICB9XG59IiwiaW8ucGljb2xhYnMuZXZlbnRzIiwicnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9Iiwic2V0X2F0dHIiLCJzZWxlY3Qgd2hlbiBldmVudHMgYmluZCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImV2ZW50cyBiaW5kIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwibmFtZSByZSNeKC4qKSQjIiwibmFtZSIsInJlI14oLiopJCMiLCJteV9uYW1lIiwic2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsInJ1bGUgb3Jfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19vciBhIG9yIGV2ZW50c19vciBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJvclwiKVxuICB9Iiwib3Jfb3AiLCJzZWxlY3Qgd2hlbiBldmVudHNfb3IgYSBvciBldmVudHNfb3IgYiIsImV2ZW50c19vciBhIiwiZXZlbnRzX29yIGIiLCJzZW5kX2RpcmVjdGl2ZShcIm9yXCIpIiwicnVsZSBhbmRfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19hbmQgYSBhbmQgZXZlbnRzX2FuZCBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJhbmRcIilcbiAgfSIsImFuZF9vcCIsInNlbGVjdCB3aGVuIGV2ZW50c19hbmQgYSBhbmQgZXZlbnRzX2FuZCBiIiwiZXZlbnRzX2FuZCBhIiwiZXZlbnRzX2FuZCBiIiwic2VuZF9kaXJlY3RpdmUoXCJhbmRcIikiLCJydWxlIGFuZF9vciB7XG4gICAgc2VsZWN0IHdoZW4gKGV2ZW50c19hbmRvciBhIGFuZCBldmVudHNfYW5kb3IgYikgb3IgZXZlbnRzX2FuZG9yIGNcbiAgICBzZW5kX2RpcmVjdGl2ZShcIihhIGFuZCBiKSBvciBjXCIpXG4gIH0iLCJhbmRfb3IiLCJzZWxlY3Qgd2hlbiAoZXZlbnRzX2FuZG9yIGEgYW5kIGV2ZW50c19hbmRvciBiKSBvciBldmVudHNfYW5kb3IgYyIsImV2ZW50c19hbmRvciBhIiwiZXZlbnRzX2FuZG9yIGIiLCJldmVudHNfYW5kb3IgYyIsInNlbmRfZGlyZWN0aXZlKFwiKGEgYW5kIGIpIG9yIGNcIikiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsIm1hdGNoZXMiLCJldmVudCIsImF0dHJzIiwiZ2V0TWF0Y2hlcyIsImtybCIsIlJlZ0V4cCIsInNjb3BlIiwic2V0IiwiU3RyaW5nIiwiZ2V0Il0sIm1hcHBpbmdzIjoiQUFBQUEsTUFBQSxDQUFBQyxPQUFBO0FBQUEsRSxRQ0FRLG9CREFSO0FBQUEsRSxRQUFBO0FBQUEsRSxT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LFVFQWdDLFVBQUFBLEdBQUE7QUFBQTtBQUFBLFdGQWhDO0FBQUEsVSxVR0FtRCxVQUFBQSxHQUFBO0FBQUE7QUFBQSxXSEFuRDtBQUFBO0FBQUEsUSxpQkFBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLFM7OztjQUFBLFE7Y0FBQSxTOzs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLOztrQkFBQSxJO2tCQUFBLFE7O29CQUFBLEk7b0JBQUEsUTtvQkFBQSxROzs7O2NBQUEsTzs7V0FBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLFM7O1dBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxTOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsTSxnQk1FRTtBQUFBLFEsV0FBQSxXQUFBQSxHQUFBO0FBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFFBQUE7QUFBQSxjLFdBQUE7QUFBQTtBQUFBO0FBQUEsT05GRjtBQUFBLEt2QmRGO0FBQUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdfQ==
