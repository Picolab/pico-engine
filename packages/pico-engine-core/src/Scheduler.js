var _ = require('lodash')
var lt = require('long-timeout')// makes it possible to have a timeout longer than 24.8 days (2^31-1 milliseconds)
var cuid = require('cuid')
var schedule = require('node-schedule')

module.exports = function (conf) {
  var currTimeout
  var cronById = {}
  var mostRecentUpdateId

  var clearCurrTimeout = function () {
    if (currTimeout && !conf.is_test_mode) {
      lt.clearTimeout(currTimeout)
    }
    currTimeout = null
  }

  var pendingAtRemoves = 0

  /**
   * call update everytime the schedule in the db changes
   */
  var update = function update () {
    if (pendingAtRemoves !== 0) {
      return// remove will call update() when it's done
    }
    var myUpdateId = cuid()
    mostRecentUpdateId = myUpdateId
    conf.db.nextScheduleEventAt(function (err, next) {
      if (mostRecentUpdateId !== myUpdateId) {
        // schedule is out of date
        return
      }
      // always clear the timeout since we're about to re-schedule it
      clearCurrTimeout()
      if (err) return conf.onError(err)
      if (!next) {
        return// nothing to schedule
      }
      var onTime = function () {
        clearCurrTimeout()// mostly for testing, but also to be certain
        if (mostRecentUpdateId !== myUpdateId) {
          // schedule is out of date
          return
        }

        // remove it, but let the scheduler know that it's pending
        pendingAtRemoves++
        conf.db.removeScheduleEventAt(next.id, next.at, function (err) {
          pendingAtRemoves--
          if (err) conf.onError(err)
          update()// check the schedule for the next
        })

        // emit the scheduled job
        conf.onEvent(next.event)
      }

      if (conf.is_test_mode) {
        // in test mode they manually trigger execution of currTimeout
        currTimeout = onTime
      } else {
        // Execute the event by milliseconds from now.
        // If it's in the past it will happen on the next tick
        currTimeout = lt.setTimeout(onTime, next.at.getTime() - Date.now())
      }
    })
  }

  var r = {
    update: update,
    addCron: function (timespec, id, eventOrig) {
      // clone in case eventOrig get's mutated
      var event = _.cloneDeep(eventOrig)

      if (_.has(cronById, id)) {
        if (true &&
                    timespec === cronById[id].timespec &&
                    _.isEqual(event, cronById[id].event)
        ) {
          return// nothing changed
        }
        cronById[id].job.cancel()// kill this cron so we can start a new on
      }
      var handler = function () {
        conf.onEvent(event)
      }
      cronById[id] = {
        timespec: timespec,
        event: event,
        job: conf.is_test_mode
          ? { handler: handler, cancel: _.noop }
          : schedule.scheduleJob(timespec, handler)
      }
    },
    rmCron: function (id) {
      if (!_.has(cronById, id)) {
        return
      }
      cronById[id].job.cancel()
      delete cronById[id]
    }
  }
  if (conf.is_test_mode) {
    r.test_mode_triggerTimeout = function () {
      if (currTimeout) {
        currTimeout()
      }
    }
    r.test_mode_triggerCron = function (id) {
      if (_.has(cronById, id)) {
        cronById[id].job.handler()
      }
    }
  }
  return r
}
