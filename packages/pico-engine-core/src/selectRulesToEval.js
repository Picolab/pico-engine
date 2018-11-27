var _ = require('lodash')
var ktypes = require('krl-stdlib/types')
var runKRL = require('./runKRL')
var aggregateEvent = require('./aggregateEvent')

function getAttrString (ctx, attr) {
  return _.has(ctx, ['event', 'attrs', attr])
    ? ktypes.toString(ctx.event.attrs[attr])
    : ''
}

async function evalExpr (ctx, rule, aggregator, exp, setting) {
  var recur = function (e) {
    return evalExpr(ctx, rule, aggregator, e, setting)
  }
  if (_.isArray(exp)) {
    let r
    if (exp[0] === 'not') {
      r = !(await recur(exp[1]))
    } else if (exp[0] === 'and') {
      r = (await recur(exp[1])) && (await recur(exp[2]))
    } else if (exp[0] === 'or') {
      r = (await recur(exp[1])) || (await recur(exp[2]))
    }
    return r
  }
  // only run the function if the domain and type match
  var ee = _.get(rule, ['select', 'graph', ctx.event.domain, ctx.event.type, exp])
  if (ee === true) {
    return true
  }
  if (_.isFunction(ee)) {
    return runKRL(ee, ctx, aggregator, getAttrString, setting)
  }
  return false
}

async function getNextState (ctx, rule, currState, aggregator, setting) {
  currState = _.flattenDeep([currState])
  let matches = []
  // run every event expression that can match, and collect a unique list of next states
  for (let cstate of currState) {
    let transitions = rule.select.state_machine[cstate]
    for (let transition of transitions) {
      let expr = transition[0]
      let state = transition[1]
      if (await evalExpr(ctx, rule, aggregator, expr, setting)) {
        // found a match
        if (matches.indexOf(state) < 0) {
          matches.push(state)
        }
      }
    }
  }
  if (_.includes(matches, 'end')) {
    return 'end'
  }
  if (matches.length === 1) {
    return matches[0]
  }
  if (matches.length > 1) {
    // This can happen when two or more expressions match and reach different states. We want to "join" them at runtime
    return matches
  }
  if (currState.length === 1) {
    currState = currState[0]
  }
  if (currState === 'end') {
    return 'start'
  }
  return currState// by default, stay on the current state
}

async function shouldRuleSelect (core, ctx, rule) {
  var smData = await core.db.getStateMachine(ctx.pico_id, rule)

  var bindings = smData.bindings || {}

  if (_.isFunction(rule.select && rule.select.within)) {
    if (!_.isNumber(smData.starttime)) {
      smData.starttime = ctx.event.timestamp.getTime()
    }
    var timeSinceLast = ctx.event.timestamp.getTime() - smData.starttime

    // restore any stored variables in a temporary scope
    var ctx2 = core.mkCTX(_.assign({}, ctx, {
      scope: ctx.scope.push()
    }))
    _.each(bindings, function (val, id) {
      ctx2.scope.set(id, val)
    })
    var timeLimit = await runKRL(rule.select.within, ctx2)

    if (timeSinceLast > timeLimit) {
      // time has expired, reset the state machine
      smData.state = 'start'
    }
    if (smData.state === 'start') {
      // set or reset the clock
      smData.starttime = ctx.event.timestamp.getTime()
      bindings = {}
    }
  }

  // restore any variables that were stored
  _.each(bindings, function (val, id) {
    ctx.scope.set(id, val)
  })

  var aggregator = aggregateEvent(core, smData.state, rule)

  var setting = function (id, val) {
    ctx.scope.set(id, val)
    bindings[id] = val
  }

  var nextState = await getNextState(ctx, rule, smData.state, aggregator, setting)

  await core.db.putStateMachine(ctx.pico_id, rule, {
    state: nextState,
    starttime: smData.starttime,
    bindings: nextState === 'end'
      ? {}
      : bindings
  })

  return nextState === 'end'
}

module.exports = async function selectRulesToEval (core, ctx) {
  // read this fresh everytime we select, b/c it might have changed during event processing
  var picoRids = await core.db.ridsOnPico(ctx.pico_id)

  var rulesToSelect = core.rsreg.salientRules(ctx.event.domain, ctx.event.type, function (rid) {
    if (picoRids[rid] !== true) {
      return false
    }
    if (_.has(ctx.event, 'for_rid') && _.isString(ctx.event.for_rid)) {
      if (rid !== ctx.event.for_rid) {
        return false
      }
    }
    return true
  })

  var rules = await Promise.all(rulesToSelect.map(function (rule) {
    var ruleCTX = core.mkCTX({
      rid: rule.rid,
      scope: rule.scope,
      event: ctx.event,
      pico_id: ctx.pico_id,
      rule_name: rule.name
    })
    return shouldRuleSelect(core, ruleCTX, rule)
      .then(function (shouldSelect) {
        return shouldSelect ? rule : null
      })
  }))
  rules = _.compact(rules)

  // rules in the same ruleset must fire in order
  rules = _.reduce(_.groupBy(rules, 'rid'), function (acc, rules) {
    return acc.concat(rules)
  }, [])
  return rules
}
