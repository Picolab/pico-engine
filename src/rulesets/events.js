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
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs['name']);
            if (!m)
              return false;
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.my_name = matches[0];
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
              'options': { 'name': ctx.vars.my_name }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuZXZlbnRzIHtcbiAgcnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9XG4gIHJ1bGUgb3Jfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19vciBhIG9yIGV2ZW50c19vciBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJvclwiKVxuICB9XG4gIHJ1bGUgYW5kX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBldmVudHNfYW5kIGEgYW5kIGV2ZW50c19hbmQgYlxuICAgIHNlbmRfZGlyZWN0aXZlKFwiYW5kXCIpXG4gIH1cbiAgcnVsZSBhbmRfb3Ige1xuICAgIHNlbGVjdCB3aGVuIChldmVudHNfYW5kb3IgYSBhbmQgZXZlbnRzX2FuZG9yIGIpIG9yIGV2ZW50c19hbmRvciBjXG4gICAgc2VuZF9kaXJlY3RpdmUoXCIoYSBhbmQgYikgb3IgY1wiKVxuICB9XG59IiwiaW8ucGljb2xhYnMuZXZlbnRzIiwicnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9Iiwic2V0X2F0dHIiLCJzZWxlY3Qgd2hlbiBldmVudHMgYmluZCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImV2ZW50cyBiaW5kIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwibmFtZSByZSNeKC4qKSQjIiwicmUjXiguKikkIyIsIm5hbWUiLCJteV9uYW1lIiwic2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsInJ1bGUgb3Jfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19vciBhIG9yIGV2ZW50c19vciBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJvclwiKVxuICB9Iiwib3Jfb3AiLCJzZWxlY3Qgd2hlbiBldmVudHNfb3IgYSBvciBldmVudHNfb3IgYiIsImV2ZW50c19vciBhIiwiZXZlbnRzX29yIGIiLCJzZW5kX2RpcmVjdGl2ZShcIm9yXCIpIiwicnVsZSBhbmRfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19hbmQgYSBhbmQgZXZlbnRzX2FuZCBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJhbmRcIilcbiAgfSIsImFuZF9vcCIsInNlbGVjdCB3aGVuIGV2ZW50c19hbmQgYSBhbmQgZXZlbnRzX2FuZCBiIiwiZXZlbnRzX2FuZCBhIiwiZXZlbnRzX2FuZCBiIiwic2VuZF9kaXJlY3RpdmUoXCJhbmRcIikiLCJydWxlIGFuZF9vciB7XG4gICAgc2VsZWN0IHdoZW4gKGV2ZW50c19hbmRvciBhIGFuZCBldmVudHNfYW5kb3IgYikgb3IgZXZlbnRzX2FuZG9yIGNcbiAgICBzZW5kX2RpcmVjdGl2ZShcIihhIGFuZCBiKSBvciBjXCIpXG4gIH0iLCJhbmRfb3IiLCJzZWxlY3Qgd2hlbiAoZXZlbnRzX2FuZG9yIGEgYW5kIGV2ZW50c19hbmRvciBiKSBvciBldmVudHNfYW5kb3IgYyIsImV2ZW50c19hbmRvciBhIiwiZXZlbnRzX2FuZG9yIGIiLCJldmVudHNfYW5kb3IgYyIsInNlbmRfZGlyZWN0aXZlKFwiKGEgYW5kIGIpIG9yIGNcIikiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1hdGNoZXMiLCJtIiwiUmVnRXhwIiwiZXhlYyIsImN0eCIsImV2ZW50IiwiYXR0cnMiLCJjYWxsYmFjayIsInVuZGVmaW5lZCIsImxlbmd0aCIsInB1c2giLCJ2YXJzIiwibXlfbmFtZSJdLCJtYXBwaW5ncyI6IkFBQUFBLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSxvQkRBUjtB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VkY7QUFBQSxJLFV1QmNFO0FBQUEsTSxRQ0FLLFFEQUw7QUFBQSxNLFVFQ0U7QUFBQSxRLFNBQUE7QUFBQSxVLGdCQUFBO0FBQUEsWSxLQUFBLEUsVUFBQTtBQUFBLFksS0FBQSxFLFVBQUE7QUFBQSxZLEtBQUEsRSxVQUFBO0FBQUE7QUFBQTtBQUFBLFEsY0FBQTtBQUFBLFUsVUNBYSxVLEdBQUEsRSxRQUFBLEU7WUFBQUQsUUFBQSxDQUFBQyxTQUFBLFE7V0RBYjtBQUFBLFUsVUVBZ0MsVSxHQUFBLEUsUUFBQSxFO1lBQUFELFFBQUEsQ0FBQUMsU0FBQSxRO1dGQWhDO0FBQUEsVSxVR0FtRCxVLEdBQUEsRSxRQUFBLEU7WUFBQUQsUUFBQSxDQUFBQyxTQUFBLFE7V0hBbkQ7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxTOzs7Y0FBQSxRO2NBQUEsUzs7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSzs7a0JBQUEsSTtrQkFBQSxROztvQkFBQSxJO29CQUFBLFE7b0JBQUEsUTs7OztjQUFBLE87O1dBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxTOztXQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsUzs7V0FBQTtBQUFBO0FBQUEsT0ZERjtBQUFBLE0sZ0JNRUU7QUFBQSxRLFdBQUEsVyxHQUFBLEUsUUFBQSxFO1lBQUFELFFBQUEsQ0FBQUMsU0FBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQTtBQUFBLGU7V0FBQTtBQUFBLE9ORkY7QUFBQSxLdkJkRjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXX0=
