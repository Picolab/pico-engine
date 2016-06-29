module.exports = {
  'name': 'io.picolabs.events',
  'meta': {},
  'rules': {
    'set_attr': {
      'name': 'set_attr',
      'select': {
        'graph': { 'echo': { 'hello': { 'expr_0': true } } },
        'eventexprs': {
          'expr_0': function (ctx, callback) {
            var matches = [];
            var m;
            m = new RegExp('^(.*)$', '').exec(ctx.event.attrs.$name$);
            if (!m)
              return callback(undefined, false);
            if (m.length > 1)
              matches.push(m[1]);
            ctx.vars.$name$ = matches[0];
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
      }
    },
    'or_op': {
      'name': 'or_op',
      'select': {
        'graph': {
          'echo': { 'hello': { 'expr_0': true } },
          'say': { 'hello': { 'expr_1': true } }
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
      }
    },
    'and_op': {
      'name': 'and_op',
      'select': {
        'graph': {
          'echo': { 'hello': { 'expr_0': true } },
          'say': { 'hello': { 'expr_1': true } }
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
      }
    },
    'and_or': {
      'name': 'and_or',
      'select': {
        'graph': {
          'echo': {
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
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzZXQgaW8ucGljb2xhYnMuZXZlbnRzIHtcbiAgcnVsZSBzZXRfYXR0ciB7XG4gICAgc2VsZWN0IHdoZW4gZWNobyBoZWxsbyBuYW1lIHJlI14oLiopJCMgc2V0dGluZyhuYW1lKTtcbiAgfVxuICBydWxlIG9yX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBlY2hvIGhlbGxvIG9yIHNheSBoZWxsb1xuICB9XG4gIHJ1bGUgYW5kX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBlY2hvIGhlbGxvIGFuZCBzYXkgaGVsbG9cbiAgfVxuICBydWxlIGFuZF9vciB7XG4gICAgc2VsZWN0IHdoZW4gKGVjaG8gYSBhbmQgZWNobyBiKSBvciBlY2hvIGNcbiAgfVxufSIsImlvLnBpY29sYWJzLmV2ZW50cyIsInJ1bGUgc2V0X2F0dHIge1xuICAgIHNlbGVjdCB3aGVuIGVjaG8gaGVsbG8gbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSk7XG4gIH0iLCJzZXRfYXR0ciIsInNlbGVjdCB3aGVuIGVjaG8gaGVsbG8gbmFtZSByZSNeKC4qKSQjIHNldHRpbmcobmFtZSkiLCJlY2hvIGhlbGxvIG5hbWUgcmUjXiguKikkIyBzZXR0aW5nKG5hbWUpIiwibmFtZSByZSNeKC4qKSQjIiwicmUjXiguKikkIyIsIm5hbWUiLCJydWxlIG9yX29wIHtcbiAgICBzZWxlY3Qgd2hlbiBlY2hvIGhlbGxvIG9yIHNheSBoZWxsb1xuICB9Iiwib3Jfb3AiLCJzZWxlY3Qgd2hlbiBlY2hvIGhlbGxvIG9yIHNheSBoZWxsbyIsImVjaG8gaGVsbG8iLCJzYXkgaGVsbG8iLCJydWxlIGFuZF9vcCB7XG4gICAgc2VsZWN0IHdoZW4gZWNobyBoZWxsbyBhbmQgc2F5IGhlbGxvXG4gIH0iLCJhbmRfb3AiLCJzZWxlY3Qgd2hlbiBlY2hvIGhlbGxvIGFuZCBzYXkgaGVsbG8iLCJydWxlIGFuZF9vciB7XG4gICAgc2VsZWN0IHdoZW4gKGVjaG8gYSBhbmQgZWNobyBiKSBvciBlY2hvIGNcbiAgfSIsImFuZF9vciIsInNlbGVjdCB3aGVuIChlY2hvIGEgYW5kIGVjaG8gYikgb3IgZWNobyBjIiwiZWNobyBhIiwiZWNobyBiIiwiZWNobyBjIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtYXRjaGVzIiwibSIsIlJlZ0V4cCIsImV4ZWMiLCJjdHgiLCJldmVudCIsImF0dHJzIiwiJG5hbWUkIiwiY2FsbGJhY2siLCJ1bmRlZmluZWQiLCJsZW5ndGgiLCJwdXNoIiwidmFycyJdLCJtYXBwaW5ncyI6IkFBQUFBLE1BQUEsQ0FBQUMsT0FBQTtBQUFBLEUsUUNBUSxvQkRBUjtBQUFBLEUsUUFBQTtBQUFBLEUsU0FBQTtBQUFBLEksWUVDRTtBQUFBLE0sUUNBSyxVREFMO0FBQUEsTSxVRUNFO0FBQUEsUSxTQUFBLEUsUUFBQSxFLFNBQUEsRSxVQUFBO0FBQUEsUSxjQUFBO0FBQUEsVSxVQ0FZLFUsR0FBQSxFLFFBQUEsRTtZQUFBLElBQUFDLE8sR0FBQSxHO1lBQUEsSUFBQUMsQ0FBQSxDO1lDQVdBLENBQUEsR0NBSyxJQUFBQyxNQUFBLGVBQUFDLElGQWhCLENHQVdDLEdBQUEsQ0FBQUMsS0FBQSxDQUFBQyxLQUFBLENBQUFDLE1IQVgsQ0NBVyxDO1lBQUEsS0FBQU4sQ0FBQTtBQUFBLHFCQUFBTyxRQUFBLENBQUFDLFNBQUEsUztZQUFBLElBQUFSLENBQUEsQ0FBQVMsTUFBQTtBQUFBLGNBQUFWLE9BQUEsQ0FBQVcsSUFBQSxDQUFBVixDQUFBLEs7WUVBd0JHLEdBQUEsQ0FBQVEsSUFBQSxDQUFBTCxNQUFBLEdBQUFQLE9BQUEsSTtZSEFuQ1EsUUFBQSxDQUFBQyxTQUFBLFE7V0RBWjtBQUFBO0FBQUEsUSxpQkFBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLE87O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxLRkRGO0FBQUEsSSxTU0lFO0FBQUEsTSxRQ0FLLE9EQUw7QUFBQSxNLFVFQ0U7QUFBQSxRLFNBQUE7QUFBQSxVLFFBQUEsRSxTQUFBLEUsVUFBQTtBQUFBLFUsT0FBQSxFLFNBQUEsRSxVQUFBO0FBQUE7QUFBQSxRLGNBQUE7QUFBQSxVLFVDQVksVSxHQUFBLEUsUUFBQSxFO1lBQUFELFFBQUEsQ0FBQUMsU0FBQSxRO1dEQVo7QUFBQSxVLFVFQTBCLFUsR0FBQSxFLFFBQUEsRTtZQUFBRCxRQUFBLENBQUFDLFNBQUEsUTtXRkExQjtBQUFBO0FBQUEsUSxpQkFBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7OztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7O2tCQUFBLEk7a0JBQUEsUTtrQkFBQSxROzs7Y0FBQSxPOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsS1RKRjtBQUFBLEksVWNPRTtBQUFBLE0sUUNBSyxRREFMO0FBQUEsTSxVRUNFO0FBQUEsUSxTQUFBO0FBQUEsVSxRQUFBLEUsU0FBQSxFLFVBQUE7QUFBQSxVLE9BQUEsRSxTQUFBLEUsVUFBQTtBQUFBO0FBQUEsUSxjQUFBO0FBQUEsVSxVSkFZLFUsR0FBQSxFLFFBQUEsRTtZQUFBRCxRQUFBLENBQUFDLFNBQUEsUTtXSUFaO0FBQUEsVSxVSEEyQixVLEdBQUEsRSxRQUFBLEU7WUFBQUQsUUFBQSxDQUFBQyxTQUFBLFE7V0dBM0I7QUFBQTtBQUFBLFEsaUJBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxTOzs7Y0FBQSxRO2NBQUEsUzs7OztnQkFBQSxLOztrQkFBQSxJO2tCQUFBLFE7a0JBQUEsUTs7O2NBQUEsTzs7V0FBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLFM7O1dBQUE7QUFBQSxVOztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7Z0JBQUEsUTs7Y0FBQSxTOztXQUFBO0FBQUE7QUFBQSxPRkRGO0FBQUEsS2RQRjtBQUFBLEksVWlCVUU7QUFBQSxNLFFDQUssUURBTDtBQUFBLE0sVUVDRTtBQUFBLFEsU0FBQTtBQUFBLFUsUUFBQTtBQUFBLFksS0FBQSxFLFVBQUE7QUFBQSxZLEtBQUEsRSxVQUFBO0FBQUEsWSxLQUFBLEUsVUFBQTtBQUFBO0FBQUE7QUFBQSxRLGNBQUE7QUFBQSxVLFVDQWEsVSxHQUFBLEUsUUFBQSxFO1lBQUFELFFBQUEsQ0FBQUMsU0FBQSxRO1dEQWI7QUFBQSxVLFVFQXdCLFUsR0FBQSxFLFFBQUEsRTtZQUFBRCxRQUFBLENBQUFDLFNBQUEsUTtXRkF4QjtBQUFBLFUsVUdBbUMsVSxHQUFBLEUsUUFBQSxFO1lBQUFELFFBQUEsQ0FBQUMsU0FBQSxRO1dIQW5DO0FBQUE7QUFBQSxRLGlCQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsUzs7O2NBQUEsUTtjQUFBLFM7OztjQUFBLFE7Y0FBQSxLOzs7O2dCQUFBLEs7O2tCQUFBLEk7a0JBQUEsUTs7b0JBQUEsSTtvQkFBQSxRO29CQUFBLFE7Ozs7Y0FBQSxPOztXQUFBO0FBQUEsVTs7Y0FBQSxRO2NBQUEsSzs7OztnQkFBQSxLO2dCQUFBLFE7O2NBQUEsUzs7V0FBQTtBQUFBLFU7O2NBQUEsUTtjQUFBLEs7Ozs7Z0JBQUEsSztnQkFBQSxROztjQUFBLFM7O1dBQUE7QUFBQTtBQUFBLE9GREY7QUFBQSxLakJWRjtBQUFBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF19
