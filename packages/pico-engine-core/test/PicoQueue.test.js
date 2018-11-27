var test = require('ava')
var PicoQueue = require('../src/PicoQueue')

function sleep (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

test.cb('PicoQueue', function (t) {
  var log = []

  var pq = PicoQueue(async function (picoId, type, data) {
    log.push(`[${picoId}] ${data} working_0`)
    await sleep(1)
    log.push(`[${picoId}] ${data} working_1`)
    await sleep(1)
    log.push(`[${picoId}] ${data} working_2`)
  })

  var enqueue = function (picoId, data, done) {
    log.push(`[${picoId}] ${data} enqueue`)
    pq.enqueue(picoId, 'test', data, function () {
      log.push(`[${picoId}] ${data} z done`)
      if (done) {
        done()
      }
    })
  }

  enqueue('A', 0)
  enqueue('A', 1)
  enqueue('B', 0)
  enqueue('A', 2, function () {
    t.deepEqual(log.filter(a => a.indexOf('[A') === 0), [
      '[A] 0 enqueue',
      '[A] 1 enqueue',
      '[A] 2 enqueue',
      '[A] 0 working_0',
      '[A] 0 working_1',
      '[A] 0 working_2',
      '[A] 0 z done',
      '[A] 1 working_0', // only start 1 after 0 finished
      '[A] 1 working_1',
      '[A] 1 working_2',
      '[A] 1 z done',
      '[A] 2 working_0', // only start 2 after 1 finished
      '[A] 2 working_1',
      '[A] 2 working_2',
      '[A] 2 z done'
    ], 'ensure all of [A] completes in order')

    t.deepEqual(log.filter(a => a.indexOf('[B') === 0), [
      '[B] 0 enqueue',
      '[B] 0 working_0',
      '[B] 0 working_1',
      '[B] 0 working_2',
      '[B] 0 z done'
    ], 'ensure all of [B] completes in order')

    t.deepEqual(log.slice(0, 7), [
      '[A] 0 enqueue',
      '[A] 1 enqueue',
      '[B] 0 enqueue',
      '[A] 2 enqueue',
      '[A] 0 working_0',
      '[B] 0 working_0', // different picos can be concurrent
      '[A] 0 working_1'
    ], 'ensure A and B work is interleaved')
    t.end()
  })
})

test.cb('PicoQueue - error', function (t) {
  var pq = PicoQueue(async function (picoId, type, data) {
    await sleep(1)
    if (data === 'foobar') {
      throw new Error(data)
    }
    return data
  })
  t.plan(6)
  pq.enqueue('A', 'test', 'baz', function (err, data) {
    t.is(err, null)
    t.is(data, 'baz')
  })
  pq.enqueue('A', 'test', 'foobar', function (err, data) {
    t.is(err + '', 'Error: foobar')
    t.is(data, void 0)
  })
  pq.enqueue('A', 'test', 'qux', function (err, data) {
    t.is(err, null)
    t.is(data, 'qux')
    t.end()
  })
})
