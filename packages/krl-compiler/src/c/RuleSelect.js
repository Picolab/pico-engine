var _ = require('lodash')

var wrapInOr = function (states) {
  if (_.size(states) === 1) {
    return _.head(states)
  }
  return ['or', _.head(states), wrapInOr(_.tail(states))]
}

var permute = function (arr) {
  return arr.reduce(function permute (res, item, key, arr) {
    return res.concat(arr.length > 1
      ? arr
        .slice(0, key)
        .concat(arr.slice(key + 1))
        .reduce(permute, [])
        .map(function (perm) {
          return [item].concat(perm)
        })
      : item
    )
  }, [])
}

var StateMachine = function () {
  var start = _.uniqueId('state_')
  var end = _.uniqueId('state_')
  var transitions = []
  var join = function (state1, state2) {
    _.each(transitions, function (t) {
      if (t[0] === state1) {
        t[0] = state2
      }
      if (t[2] === state1) {
        t[2] = state2
      }
    })
  }
  return {
    start: start,
    end: end,
    add: function (fromState, onEvent, toState) {
      transitions.push([fromState, onEvent, toState])
    },
    getTransitions: function () {
      return transitions
    },
    concat: function (other) {
      _.each(other.getTransitions(), function (t) {
        transitions.push(_.cloneDeep(t))
      })
    },
    join: join,
    optimize: function () {
      // Find all cases where the same event goes to different states and join those states into one
      while (true) {
        let toJoin = []
        let groupped = {}
        _.each(transitions, function (t) {
          var key = t[0] + JSON.stringify(t[1])// stringify b/c ["not","expr_1"]
          var state = t[2]
          if (_.has(groupped, key)) {
            if (state !== groupped[key]) {
              toJoin.push([state, groupped[key]])
            }
          } else {
            groupped[key] = state
          }
        })
        if (toJoin.length === 0) {
          break
        }
        toJoin.forEach(function (j) {
          join(j[0], j[1])
        })
      }
      // Remove duplicate transitions
      let tree = {}
      _.each(transitions, function (t) {
        _.set(tree, [JSON.stringify(t[1]), t[0], t[2]], true)
      })
      transitions = []
      _.each(tree, function (froms, onEvent) {
        _.each(froms, function (tos, fromState) {
          _.each(tos, function (bool, toState) {
            transitions.push([fromState, JSON.parse(onEvent), toState])
          })
        })
      })
    },
    compile: function () {
      // we want to ensure we get the same output on every compile
      // that is why we are re-naming states and sorting the output
      var outStates = {}
      outStates[start] = 'start'
      outStates[end] = 'end'
      var i = 0
      var toOutState = function (state) {
        if (_.has(outStates, state)) {
          return outStates[state]
        }
        outStates[state] = 's' + (i++)
        return outStates[state]
      }
      var outTransitions = _.sortBy(_.map(transitions, function (t) {
        return [toOutState(t[0]), t[1], toOutState(t[2])]
      }), function (t) {
        var score = 0
        if (t[0] === 'start') {
          score -= Infinity
        }
        if (t[0] === 'end') {
          score += Infinity
        }
        if (/^s[0-9]+$/.test(t[0])) {
          score += _.parseInt(t[0].substring(1), 10) || 0
        }
        return score
      })
      var stm = {}
      _.each(outTransitions, function (t) {
        if (!_.has(stm, t[0])) {
          stm[t[0]] = []
        }
        stm[t[0]].push([t[1], t[2]])
      })
      return stm
    }
  }
}

var toLispArgs = function (ast, traverse) {
  return _.map(ast.args, traverse)
}

var eventOps = {
  'before': {
    toLispArgs: toLispArgs,
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var prev
      _.each(args, function (arg, j) {
        var a = evalEELisp(arg)
        s.concat(a)
        if (j === 0) {
          s.join(a.start, s.start)
        }
        if (j === _.size(args) - 1) {
          s.join(a.end, s.end)
        }
        if (prev) {
          s.join(prev.end, a.start)
        }
        prev = a
      })

      return s
    }
  },
  'after': {
    toLispArgs: toLispArgs,
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var prev
      _.each(_.range(_.size(args) - 1, -1), function (i, j) {
        var a = evalEELisp(args[i])
        s.concat(a)
        if (j === 0) {
          s.join(a.start, s.start)
        }
        if (j === _.size(args) - 1) {
          s.join(a.end, s.end)
        }
        if (prev) {
          s.join(prev.end, a.start)
        }
        prev = a
      })

      return s
    }
  },
  'then': {
    toLispArgs: toLispArgs,
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var mergePoints = []
      var prev
      _.each(args, function (arg, j) {
        var a = evalEELisp(arg)
        s.concat(a)
        if (j === 0) {
          s.join(a.start, s.start)
        }
        if (j === _.size(args) - 1) {
          s.join(a.end, s.end)
        }
        if (prev) {
          s.join(prev.end, a.start)
          mergePoints.push(a.start)
        }
        prev = a
      })

      var transitions = s.getTransitions()
      _.each(mergePoints, function (daState) {
        // if not daState return to start
        var notB = wrapInOr(_.uniq(_.compact(_.map(transitions, function (t) {
          if (t[0] === daState) {
            return ['not', t[1]]
          }
        }))))
        s.add(daState, notB, s.start)
      })

      return s
    }
  },
  'and': {
    toLispArgs: toLispArgs,
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      _.each(permute(_.range(0, _.size(args))), function (indices) {
        var prev
        _.each(indices, function (i, j) {
          var a = evalEELisp(args[i])
          s.concat(a)
          if (j === 0) {
            s.join(a.start, s.start)
          }
          if (j === _.size(indices) - 1) {
            s.join(a.end, s.end)
          }
          if (prev) {
            s.join(prev.end, a.start)
          }
          prev = a
        })
      })

      return s
    }
  },
  'or': {
    toLispArgs: toLispArgs,
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      _.each(args, function (arg) {
        var a = evalEELisp(arg)
        s.concat(a)
        s.join(a.start, s.start)
        s.join(a.end, s.end)
      })

      return s
    }
  },
  'between': {
    toLispArgs: toLispArgs,
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var a = evalEELisp(args[0])
      var b = evalEELisp(args[1])
      var c = evalEELisp(args[2])

      s.concat(a)
      s.concat(b)
      s.concat(c)

      s.join(b.start, s.start)
      s.join(b.end, a.start)
      s.join(a.end, c.start)
      s.join(c.end, s.end)

      return s
    }
  },
  'not between': {
    toLispArgs: toLispArgs,
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var a = evalEELisp(args[0])
      var b = evalEELisp(args[1])
      var c = evalEELisp(args[2])

      s.concat(a)
      s.concat(b)
      s.concat(c)

      // start:b -> c -> end
      s.join(b.start, s.start)
      s.join(b.end, c.start)
      s.join(c.end, s.end)

      // a -> start
      s.join(a.start, c.start)
      s.join(a.end, s.start)

      return s
    }
  },
  'any': {
    toLispArgs: function (ast, traverse) {
      var num = _.head(ast.args)
      return [num.value].concat(_.map(_.tail(ast.args), traverse))
    },
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var num = _.head(args)
      var eventexs = _.tail(args)

      var indicesGroups = _.uniqWith(_.map(permute(_.range(0, _.size(eventexs))), function (indices) {
        return _.take(indices, num)
      }), _.isEqual)

      _.each(indicesGroups, function (indices) {
        indices = _.take(indices, num)
        var prev
        _.each(indices, function (i, j) {
          var a = evalEELisp(eventexs[i])
          s.concat(a)
          if (j === 0) {
            s.join(a.start, s.start)
          }
          if (j === _.size(indices) - 1) {
            s.join(a.end, s.end)
          }
          if (prev) {
            s.join(prev.end, a.start)
          }
          prev = a
        })
      })

      return s
    }
  },
  'count': {
    toLispArgs: function (ast, traverse) {
      return [ast.n.value].concat(_.map([ast.event], traverse))
    },
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var num = _.head(args)
      var eventex = _.head(_.tail(args))

      var prev
      _.each(_.range(0, num), function (i, j) {
        var a = evalEELisp(eventex)
        s.concat(a)
        if (j === 0) {
          s.join(a.start, s.start)
        }
        if (j === num - 1) {
          s.join(a.end, s.end)
        }
        if (prev) {
          s.join(prev.end, a.start)
        }
        prev = a
      })

      return s
    }
  },
  'repeat': {
    toLispArgs: function (ast, traverse) {
      return [ast.n.value].concat(_.map([ast.event], traverse))
    },
    mkStateMachine: function (args, evalEELisp) {
      var s = StateMachine()

      var num = _.head(args)
      var eventex = _.head(_.tail(args))

      var prev
      _.each(_.range(0, num), function (i, j) {
        var a = evalEELisp(eventex)
        s.concat(a)
        if (j === 0) {
          s.join(a.start, s.start)
        }
        if (j === num - 1) {
          s.join(a.end, s.end)
        }
        if (prev) {
          s.join(prev.end, a.start)
        }
        prev = a
      })

      s.add(s.end, eventex, s.end)

      return s
    }
  }
}

module.exports = function (ast, comp, e) {
  if (ast.kind !== 'when') {
    throw new Error('RuleSelect.kind not supported: ' + ast.kind)
  }
  var eeId = 0
  var graph = {}

  var onEE = function (ast) {
    var domain = ast.event_domain.value
    var type = ast.event_type.value
    var ee = comp(ast)

    var id = 'expr_' + (eeId++)
    _.set(graph, [domain, type, id], ee)
    return id
  }

  var traverse = function (ast) {
    switch (ast.type) {
      case 'EventExpression':
        return onEE(ast)
      case 'EventOperator':
      case 'EventGroupOperator':
        if (!_.has(eventOps, ast.op)) {
          throw new Error(ast.type + '.op not supported: ' + ast.op)
        }
        return [ast.op].concat(eventOps[ast.op].toLispArgs(ast, traverse))
      default:
        throw new Error('invalid event ast node: ' + ast.type)
    }
  }

  var evalEELisp = function (lisp) {
    var s
    if (_.isString(lisp)) {
      s = StateMachine()
      s.add(s.start, lisp, s.end)
      return s
    }
    if (_.has(eventOps, lisp[0])) {
      s = eventOps[lisp[0]].mkStateMachine(lisp.slice(1), evalEELisp)
      s.optimize()
      return s
    } else {
      throw new Error('EventOperator.op not supported: ' + ast.op)
    }
  }

  var lisp = traverse(ast.event)
  var stateMachine = evalEELisp(lisp)

  var r = {
    graph: e('obj', _.mapValues(graph, function (types, domain) {
      return e('obj', _.mapValues(types, function (exprs, type) {
        return e('obj', exprs)
      }))
    })),
    state_machine: e('json', stateMachine.compile())
  }
  if (ast.within) {
    r.within = comp(ast.within)
  }
  return e('obj', r)
}
