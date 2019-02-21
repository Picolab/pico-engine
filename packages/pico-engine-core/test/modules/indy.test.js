const test = require('ava')
const mkTestPicoEngine = require('../helpers/mkTestPicoEngine')

test('module - sovrin:pack/unpack', async function (t) {
  const pe = await mkTestPicoEngine()
  const ctx = {}
  const pack = await pe.modules.get(ctx, 'indy', 'pack')
  const unpack = await pe.modules.get(ctx, 'indy', 'unpack')

  t.deepEqual(await pack(ctx, []), {})
  t.deepEqual(await unpack(ctx, []), { message: 'secret message' })
})
