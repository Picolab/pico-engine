var test = require('tape')
var mkTestPicoEngine = require('../helpers/mkTestPicoEngine')

test('schedule:remove', function (t) {
  mkTestPicoEngine({}, function (err, pe) {
    if (err) return t.end(err);

    (async function () {
      var remove = await pe.modules.get({}, 'schedule', 'remove')

      var val = await pe.scheduleEventAtYieldable(new Date(), {
        domain: 'd',
        type: 't',
        attributes: {}
      })

      t.deepEquals(await remove({}, [val.id]), [true])
      t.deepEquals(await remove({}, ['404']), [false])
    }()).then(t.end).catch(t.end)
  })
})
