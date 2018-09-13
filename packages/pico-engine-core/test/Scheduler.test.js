var _ = require('lodash')
var testA = require('./helpers/testA')
var Scheduler = require('../src/Scheduler')

testA('Scheduler - at', function (t) {
  var log = []
  var queueNextEventAt = []
  var queueRemoveEventAt = []

  var popNextEventAt = function (id, ignoreIfEmpty) {
    // pop off the oldest callback
    var callback = queueNextEventAt.shift()
    if (ignoreIfEmpty && !callback) {
      return
    }
    if (!id) {
      return callback()
    }
    callback(null, {
      id: id,
      at: new Date(), // doesn't matter
      event: id// shape doesn't matter here
    })
  }

  var popRemoveEventAt = function () {
    // pop off the oldest callback
    var callback = queueRemoveEventAt.shift()
    callback()
  }

  var sch = Scheduler({
    is_test_mode: true,
    db: {
      nextScheduleEventAt: function (callback) {
        queueNextEventAt.push(callback)
      },
      removeScheduleEventAt: function (id, at, callback) {
        queueRemoveEventAt.push(callback)
      }
    },
    onError: function (err) {
      log.push(['ERROR', err])
    },
    onEvent: function (event) {
      log.push(['EVENT', event])
    }
  })

  sch.update()
  sch.update()
  popNextEventAt('1')
  sch.test_mode_triggerTimeout()
  popNextEventAt('1')
  sch.test_mode_triggerTimeout()
  popRemoveEventAt()
  popNextEventAt(null)

  t.deepEquals(log, [['EVENT', '1']], 'the event should only fire once!')

  log = []

  sch.update()
  popNextEventAt('foo')
  sch.test_mode_triggerTimeout()
  // notice "foo" has not be removed from the db yet
  sch.update()
  popNextEventAt('foo', true)// "foo" is still in the db, so naturally it will apear here
  sch.test_mode_triggerTimeout()
  popRemoveEventAt()
  popNextEventAt(null, true)
  popNextEventAt(null, true)

  t.deepEquals(log, [['EVENT', 'foo']], 'the event should only fire once!')

  t.equals(queueNextEventAt.length, 0, 'should be no outstanding nextEventAt callbacks')
  t.equals(queueRemoveEventAt.length, 0, 'should be no outstanding removeEventAt callbacks')
})

var nTicks = function (n, callback) {
  if (n === 0) {
    callback()
    return
  }
  process.nextTick(function () {
    nTicks(n - 1, callback)
  })
}

var randomTick = function (callback) {
  // 0 means no tick i.e. synchronous
  nTicks(_.random(0, 4), callback)
}

testA.cb('Scheduler - at - generative test', function (t) {
  var nEvents = 50000

  if (process.env.SKIP_LONG_TESTS === 'true') {
    // shorten the generative test when running the tests quick i.e. `npm start`
    nEvents = 5
  }

  var log = []
  var eventQueue = []

  var sch = Scheduler({
    is_test_mode: true,
    db: {
      nextScheduleEventAt: function (callback) {
        randomTick(function () {
          if (eventQueue.length === 0) {
            // console.log("popNextEventAt(null)");
            return callback()
          }
          // read the next event to run, then tick again
          var id = eventQueue[0]
          var next = {
            id: id,
            at: new Date(), // doesn't matter for this test
            event: id// shape doesn't matter for this test
          }
          randomTick(function () {
            // console.log("popNextEventAt(", id, ")");
            callback(null, next)
            nTicks(_.random(1, 4), function () {
              // console.log("test_mode_triggerTimeout()");
              sch.test_mode_triggerTimeout()
            })
          })
        })
      },
      removeScheduleEventAt: function (id, at, callback) {
        randomTick(function () {
          _.pull(eventQueue, id)
          randomTick(function () {
            // console.log("popRemoveEventAt()", id);
            callback()
            if (id === nEvents) {
              process.nextTick(function () {
                onDone()
              })
            }
          })
        })
      }
    },
    onError: function (err) {
      // this test expects no errors to occur
      t.end(err)
    },
    onEvent: function (event) {
      log.push(event)
    }
  })
  // console.log("update()");
  sch.update()

  var eventI = 0

  var tickLoop = function () {
    if (eventI >= nEvents) {
      return
    }
    randomTick(function () {
      eventI++
      eventQueue.push(eventI)
      // console.log("update()");
      sch.update()
      tickLoop()
    })
  }
  tickLoop()

  function onDone () {
    var fail = false
    var i
    for (i = 0; i < log.length; i++) {
      if (log[i] !== (i + 1)) {
        fail = true
        break
      }
    }
    if (fail) {
      t.fail('events out of order! ' + log.join(','))
    } else {
      t.ok(true, 'events in order')
    }
    t.end()
  }
})
