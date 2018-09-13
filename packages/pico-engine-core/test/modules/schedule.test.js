var testA = require('../helpers/testA')
var mkTestPicoEngine = require('../helpers/mkTestPicoEngine')

testA('schedule:remove', async function (t) {
  var pe = await mkTestPicoEngine({})

  var remove = await pe.modules.get({}, 'schedule', 'remove')

  var val = await pe.scheduleEventAtYieldable(new Date(), {
    domain: 'd',
    type: 't',
    attributes: {}
  })

  t.deepEquals(await remove({}, [val.id]), [true])
  t.deepEquals(await remove({}, ['404']), [false])
})
