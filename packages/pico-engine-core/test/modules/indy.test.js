const test = require('ava')
const mkTestPicoEngine = require('../helpers/mkTestPicoEngine')

test('module - sovrin:pack/unpack', async function (t) {
  const pe = await mkTestPicoEngine({
    __dont_use_sequential_ids_for_testing: true, // we ned real DID's
    rootRIDs: ['io.picolabs.hello_world']// to auto create the root pico
  })
  const ctx = {}
  // setup 2 channels to talk to each other
  const getPicoIDByECI = await pe.modules.get({}, 'engine', 'getPicoIDByECI')
  const newPico = await pe.modules.get(ctx, 'engine', 'newPico')
  const listChannels = await pe.modules.get(ctx, 'engine', 'listChannels')

  const rootECI = await pe.getRootECI()
  const rootPicoId = await getPicoIDByECI({}, [rootECI])
  const bobPico = (await newPico(ctx, { parent_id: rootPicoId }))[0]
  const bobChannel = (await listChannels(ctx, [bobPico.id]))[0]

  const eciAlice = rootECI
  const eciBob = bobChannel.id
  const pubKeyBob = bobChannel.sovrin.indyPublic

  const pack = await pe.modules.get(ctx, 'indy', 'pack')
  const unpack = await pe.modules.get(ctx, 'indy', 'unpack')

  // Anoncrypt
  let packed = await pack(ctx, ['something secret', [pubKeyBob]])
  let unpacked = await unpack(ctx, [packed, eciBob])
  t.is(unpacked.message, 'something secret')

  // Authcrypt
  packed = await pack(ctx, ['something else secret', [pubKeyBob], eciAlice])
  unpacked = await unpack(ctx, [packed, eciBob])
  t.is(unpacked.message, 'something else secret')
})
