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
            ctx.scope.set('my_name', matches[0]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuZXZlbnRzIHtcbiAgcnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9XG4gIHJ1bGUgb3Jfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19vciBhIG9yIGV2ZW50c19vciBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJvclwiKVxuICB9XG4gIHJ1bGUgYW5kX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBldmVudHNfYW5kIGEgYW5kIGV2ZW50c19hbmQgYlxuICAgIHNlbmRfZGlyZWN0aXZlKFwiYW5kXCIpXG4gIH1cbiAgcnVsZSBhbmRfb3Ige1xuICAgIHNlbGVjdCB3aGVuIChldmVudHNfYW5kb3IgYSBhbmQgZXZlbnRzX2FuZG9yIGIpIG9yIGV2ZW50c19hbmRvciBjXG4gICAgc2VuZF9kaXJlY3RpdmUoXCIoYSBhbmQgYikgb3IgY1wiKVxuICB9XG59IiwiaW8ucGljb2xhYnMuZXZlbnRzIiwicnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZXZlbnRzIGJpbmQgbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobXlfbmFtZSk7XG4gICAgc2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZVxuICB9Iiwic2V0X2F0dHIiLCJzZWxlY3Qgd2hlbiBldmVudHMgYmluZCBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhteV9uYW1lKSIsImV2ZW50cyBiaW5kIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG15X25hbWUpIiwibmFtZSByZSNeKC4qKSQjIiwicmUjXiguKikkIyIsIm5hbWUiLCJteV9uYW1lIiwic2VuZF9kaXJlY3RpdmUoXCJib3VuZFwiKSB3aXRoXG4gICAgICBuYW1lID0gbXlfbmFtZSIsInJ1bGUgb3Jfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19vciBhIG9yIGV2ZW50c19vciBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJvclwiKVxuICB9Iiwib3Jfb3AiLCJzZWxlY3Qgd2hlbiBldmVudHNfb3IgYSBvciBldmVudHNfb3IgYiIsImV2ZW50c19vciBhIiwiZXZlbnRzX29yIGIiLCJzZW5kX2RpcmVjdGl2ZShcIm9yXCIpIiwicnVsZSBhbmRfb3Age1xuICAgIHNlbGVjdCB3aGVuIGV2ZW50c19hbmQgYSBhbmQgZXZlbnRzX2FuZCBiXG4gICAgc2VuZF9kaXJlY3RpdmUoXCJhbmRcIilcbiAgfSIsImFuZF9vcCIsInNlbGVjdCB3aGVuIGV2ZW50c19hbmQgYSBhbmQgZXZlbnRzX2FuZCBiIiwiZXZlbnRzX2FuZCBhIiwiZXZlbnRzX2FuZCBiIiwic2VuZF9kaXJlY3RpdmUoXCJhbmRcIikiLCJydWxlIGFuZF9vciB7XG4gICAgc2VsZWN0IHdoZW4gKGV2ZW50c19hbmRvciBhIGFuZCBldmVudHNfYW5kb3IgYikgb3IgZXZlbnRzX2FuZG9yIGNcbiAgICBzZW5kX2RpcmVjdGl2ZShcIihhIGFuZCBiKSBvciBjXCIpXG4gIH0iLCJhbmRfb3IiLCJzZWxlY3Qgd2hlbiAoZXZlbnRzX2FuZG9yIGEgYW5kIGV2ZW50c19hbmRvciBiKSBvciBldmVudHNfYW5kb3IgYyIsImV2ZW50c19hbmRvciBhIiwiZXZlbnRzX2FuZG9yIGIiLCJldmVudHNfYW5kb3IgYyIsInNlbmRfZGlyZWN0aXZlKFwiKGEgYW5kIGIpIG9yIGNcIikiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImN0eCIsIm1hdGNoZXMiLCJtIiwiUmVnRXhwIiwiZXhlYyIsImV2ZW50IiwiYXR0cnMiLCJsZW5ndGgiLCJwdXNoIiwic2NvcGUiLCJzZXQiLCJnZXQiXSwibWFwcGluZ3MiOiJBQUFBQSxNQUFBLENBQUFDLE9BQUE7QUFBQSxFLFFDQVEsb0JEQVI7QUFBQSxFLFFBQUE7QUFBQSxFLFNB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O0FBQUEsV0RBYjtBQUFBLFUsVUVBZ0MsVUFBQUEsR0FBQTtBQUFBO0FBQUEsV0ZBaEM7QUFBQSxVLFVHQW1ELFVBQUFBLEdBQUE7QUFBQTtBQUFBLFdIQW5EO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsUzs7O2NBQUEsUTtjQUFBLFM7OztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7O2tCQUFBLEk7a0JBQUEsUTs7b0JBQUEsSTtvQkFBQSxRO29CQUFBLFE7Ozs7Y0FBQSxPOztXQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsUzs7V0FBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLFM7O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxNLGdCTUVFO0FBQUEsUSxXQUFBLFdBQUFBLEdBQUE7QUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsUUFBQTtBQUFBLGMsV0FBQTtBQUFBO0FBQUE7QUFBQSxPTkZGO0FBQUEsS3ZCZEY7QUFBQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
