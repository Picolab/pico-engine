const test = require('ava')
const mkTestPicoEngine = require('../helpers/mkTestPicoEngine')

test('module - sovrin:pack/unpack', async function (t) {
  const pe = await mkTestPicoEngine({
    __dont_use_sequential_ids_for_testing: true, // we ned real DID's
    rootRIDs: ['io.picolabs.hello_world']// to auto create the root pico
  })
  const ctx = {}
  // setup 2 channels to talk to each other
  const rootECI = await pe.getRootECI()
  const getPicoIDByECI = await pe.modules.get({}, 'engine', 'getPicoIDByECI')
  const rootPicoId = await getPicoIDByECI({}, [rootECI])
  const newPico = await pe.modules.get(ctx, 'engine', 'newPico')
  const subPicoEci = (await newPico(ctx, { parent_id: rootPicoId }))[0].admin_eci
  const eciAlice = rootECI
  const eciBob = subPicoEci
  t.is(typeof eciBob, 'string')

  const pack = await pe.modules.get(ctx, 'indy', 'pack')
  const unpack = await pe.modules.get(ctx, 'indy', 'unpack')

  // Anoncrypt
  let packed = await pack(ctx, ['something secret', [eciBob]])
  let unpacked = await unpack(ctx, [packed, eciBob])
  t.deepEqual(unpacked, { message: 'secret message' })

  // Authcrypt
  // packed = await pack(ctx, ['something else secret', [eciBob], eciAlice])
  // unpacked = await unpack(ctx, [packed, eciBob])
  // t.deepEqual(unpacked, { message: 'secret else message' })
})
