var mkKRLfn = require('../mkKRLfn')
var mkKRLaction = require('../mkKRLaction')

module.exports = function (core) {
  return {
    def: {
      list: mkKRLfn([
      ], function (ctx, args) {
        return core.db.listScheduledYieldable()
      }),

      remove: mkKRLaction([
        'id'
      ], async function (ctx, args) {
        // if it's a `repeat` we need to stop it
        core.scheduler.rmCron(args.id)

        let found = false
        try {
          await core.db.removeScheduledYieldable(args.id)
          found = true
        } catch (err) {
          if (err && !err.notFound) throw err
        }
        // if event `at` we need to update the schedule
        core.scheduler.update()
        return found
      })
    }
  }
}
