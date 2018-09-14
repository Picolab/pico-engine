var _ = require('lodash')
var test = require('ava')
var runAction = require('../src/runAction')

test('runAction - send_directive', async function (t) {
  var mkCtx = function (name, options) {
    return {
      addActionResponse: function (ctx, type, val) {
        t.is(val.name, name)
        t.truthy(_.isEqual(val.options, options))// to t.deepEqual, [] == {}
      },
      scope: {
        has: _.noop
      }
    }
  }

  var noopCtx = {
    addActionResponse: _.noop,
    scope: {
      has: _.noop
    }
  }

  var testFn = async function (args, name, options) {
    var ctx = mkCtx(name, options)
    await runAction(ctx, void 0, 'send_directive', _.cloneDeep(args), [])
  }

  var testErr = async function (args, error) {
    try {
      await runAction(noopCtx, void 0, 'send_directive', args, [])
      t.fail('Failed to throw an error')
    } catch (err) {
      t.is(err + '', error)
    }
  }

  var str = 'post'
  var map = { "don't": 'mutate' }

  var errMsg1 = 'Error: send_directive needs a name string'
  var errMsg2 = 'TypeError: send_directive was given [Map] instead of a name string'

  await testFn([str, map], str, map)
  await testFn([str], str, {})

  await testErr([], errMsg1)
  await testErr({ 'options': null }, errMsg1)
  await testErr([map], errMsg2)
  await testErr([map, map], errMsg2)
  await testErr([map, str], errMsg2)
  await testErr([str, void 0], 'TypeError: send_directive was given null instead of an options map')
  await testErr([str, []], 'TypeError: send_directive was given [Array] instead of an options map')
})
